/**
 * BAC Calculator - TypeScript implementation of pharmacokinetic model
 * Uses first-order absorption and zero-order elimination
 */

const ETHANOL_DENSITY = 0.789; // g/mL

export interface PersonParams {
  height: number; // cm
  weight: number; // kg
  age: number;
  sex: 'male' | 'female';
}

export interface DrinkParams {
  timeHr: number;
  volumeMl: number;
  abv: number; // 0-1
}

class Person {
  H: number; // height cm
  W: number; // weight kg
  A: number; // age years
  sex: 'male' | 'female';
  TBW: number; // Total Body Water (L)
  Vd: number; // Volume of Distribution (dL)
  beta: number; // Elimination rate (g/dL/hr)

  constructor(params: PersonParams) {
    this.H = params.height;
    this.W = params.weight;
    this.A = params.age;
    this.sex = params.sex;
    this.TBW = this.computeTBW();
    this.Vd = 10.0 * this.TBW;
    this.beta = this.computeBeta();
  }

  private computeTBW(): number {
    if (this.sex === 'male') {
      return 2.447 - 0.09156 * this.A + 0.1074 * this.H + 0.3362 * this.W;
    } else {
      return -2.097 + 0.1069 * this.H + 0.2466 * this.W;
    }
  }

  private computeBeta(): number {
    // Step 1: Mass-based ethanol clearance (g/hr)
    const betaMass = this.sex === 'male' ? 0.0170 * this.W : 0.0200 * this.W;
    
    // Step 2: Convert to BAC slope (g/dL/hr)
    return betaMass / this.Vd;
  }
}

class Drink {
  t: number; // time hours
  V: number; // volume mL
  ABV: number; // alcohol by volume
  D: number; // ethanol dose grams
  GI: number; // gut compartment grams
  active: boolean;
  absEndTime: number;

  constructor(timeHr: number, volumeMl: number, abv: number, ka: number) {
    this.t = timeHr;
    this.V = volumeMl;
    this.ABV = abv;
    this.D = ETHANOL_DENSITY * this.V * this.ABV;
    this.GI = this.D;
    this.active = false;
    this.absEndTime = timeHr + 5.0 / ka;
  }
}

export type MealState = 'fasted' | 'light' | 'heavy';

export class BACSimulator {
  person: Person;
  dt: number; // time step hours
  time: number; // current time hours
  B: number; // blood ethanol grams
  drinks: Drink[];
  ka: number; // absorption rate constant

  constructor(person: PersonParams, mealState: MealState, dtMin: number = 5) {
    this.person = new Person(person);
    this.dt = dtMin / 60.0; // convert minutes to hours
    this.time = 0.0;
    this.B = 0.0;
    this.drinks = [];
    this.ka = this.setKa(mealState);
  }

  private setKa(mealState: MealState): number {
    switch (mealState) {
      case 'fasted':
        return 2.0;
      case 'light':
        return 1.0;
      case 'heavy':
        return 0.5;
      default:
        return 1.0;
    }
  }

  logDrink(timeHr: number, volumeMl: number, abv: number): void {
    this.drinks.push(new Drink(timeHr, volumeMl, abv, this.ka));
  }

  step(): number {
    let totalAbsorbed = 0.0;

    // Activate drinks when their time comes
    for (const d of this.drinks) {
      if (!d.active && this.time >= d.t) {
        d.active = true;
      }
    }

    // Absorption phase
    for (const d of this.drinks) {
      if (d.active && d.GI > 0) {
        let dG: number;
        if (this.time >= d.absEndTime) {
          dG = d.GI;
          d.GI = 0.0;
        } else {
          dG = d.GI * (1.0 - Math.exp(-this.ka * this.dt));
          d.GI -= dG;
        }
        totalAbsorbed += dG;
      }
    }

    // Add absorbed ethanol to blood
    this.B += totalAbsorbed;

    // Elimination phase
    const elim = this.person.beta * this.person.Vd * this.dt;
    this.B = Math.max(0.0, this.B - elim);

    // Advance time
    this.time += this.dt;

    return this.getBAC();
  }

  getBAC(): number {
    return this.B / this.person.Vd;
  }

  simulateUntilZero(): { times: number[]; bacs: number[] } {
    const times: number[] = [];
    const bacs: number[] = [];

    while (this.getBAC() > 0.001) {
      // Stop when BAC < 0.001
      const bac = this.step();
      times.push(this.time);
      bacs.push(bac);

      // Safety check: max 24 hours
      if (this.time > 24) break;
    }

    return { times, bacs };
  }

  // Get current BAC curve from current state
  getCurrentCurve(hoursAhead: number = 4): { times: number[]; bacs: number[] } {
    const times: number[] = [];
    const bacs: number[] = [];
    
    const currentTime = this.time;
    const endTime = currentTime + hoursAhead;
    
    // Create a clone to simulate forward
    const clone = this.clone();
    
    while (clone.time < endTime && clone.getBAC() > 0.001) {
      bacs.push(clone.getBAC());
      times.push(clone.time);
      clone.step();
    }
    
    return { times, bacs };
  }

  // Predict future BAC assuming no more drinks
  // Accounts for ongoing absorption from drinks still in gut
  predictFutureBAC(hoursAhead: number = 4): { times: number[]; bacs: number[] } {
    const times: number[] = [];
    const bacs: number[] = [];
    
    // Clone the simulator to avoid modifying the actual state
    const clone = this.clone();
    const startTime = clone.time;
    const endTime = startTime + hoursAhead;
    
    // Simulate forward, accounting for ongoing absorption and elimination
    while (clone.time < endTime && clone.getBAC() > 0.001) {
      const bac = clone.step();
      times.push(clone.time);
      bacs.push(bac);
      
      // Safety check: max 24 hours
      if (clone.time > startTime + 24) break;
    }
    
    return { times, bacs };
  }

  clone(): BACSimulator {
    const cloned = new BACSimulator(
      {
        height: this.person.H,
        weight: this.person.W,
        age: this.person.A,
        sex: this.person.sex,
      },
      this.ka === 2.0 ? 'fasted' : this.ka === 1.0 ? 'light' : 'heavy',
      this.dt * 60
    );
    
    cloned.time = this.time;
    cloned.B = this.B;
    cloned.drinks = this.drinks.map(d => {
      const drink = new Drink(d.t, d.V, d.ABV, this.ka);
      drink.GI = d.GI;
      drink.active = d.active;
      drink.absEndTime = d.absEndTime;
      return drink;
    });
    
    return cloned;
  }
}

