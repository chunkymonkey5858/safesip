# Drink Button Registration Details

When you click each drink button, here's what gets registered:

## 🍺 Beer Button
- **Volume:** 355 mL (12 fluid ounces)
- **ABV:** 5% (0.05)
- **Ethanol Content:** ~14 grams
- **Standard Size:** 1 standard beer

## 🥃 Shot Button  
- **Volume:** 44 mL (1.5 fluid ounces)
- **ABV:** 40% (0.40)
- **Ethanol Content:** ~14 grams
- **Standard Size:** 1 standard shot (whiskey, vodka, etc.)

## 🍷 Wine Button
- **Volume:** 148 mL (5 fluid ounces)
- **ABV:** 12% (0.12)
- **Ethanol Content:** ~14 grams
- **Standard Size:** 1 standard glass of wine

## 🍹 Cocktail Button
- **Volume:** 120 mL (4 fluid ounces)
- **ABV:** 15% (0.15)
- **Ethanol Content:** ~14 grams
- **Standard Size:** 1 standard cocktail

## What Happens When You Click:

1. **Drink is logged** with current timestamp
2. **Added to your session** drink list
3. **BAC simulator** calculates:
   - Ethanol mass from volume × ABV × density (0.789 g/mL)
   - Absorption rate based on meal state (ka)
   - First-order absorption into bloodstream
   - Zero-order elimination from body
4. **BAC updates** in real-time every 5 seconds
5. **Graph updates** showing current and predicted BAC

## Notes:

- All drinks contain approximately **14 grams of ethanol** (1 standard drink)
- Absorption rate (ka) depends on meal state:
  - **Fasted:** 2.0 hr⁻¹ (fastest)
  - **Light Meal:** 1.0 hr⁻¹ (medium)
  - **Heavy Meal:** 0.5 hr⁻¹ (slowest)
- Elimination is constant rate based on your weight and sex
- Multiple drinks are tracked independently with their own absorption curves

