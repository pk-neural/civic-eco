"""
EcoPulse ML Model Training Script
Trains four Random Forest models:
  1. AQI Predictor — predicts future AQI from environmental features
  2. Eco Score Predictor — scores user lifestyle input (0-100)
  3. Temperature Hourly — predicts hourly temperature for next 72 h
  4. Rain Hourly — predicts hourly rainfall probability for next 72 h

Synthetic but realistic data is generated based on Indian climate baselines.
Run this script once; it saves .pkl model files to the ml-model/ directory.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

np.random.seed(42)
N = 5000  # number of synthetic samples


# ─────────────────────────────────────────────
# 1. AQI PREDICTION MODEL (unchanged)
# Features: temperature, humidity, wind_speed, pressure,
#           pm25, pm10, co, no2, so2, o3
# Target: aqi (next hour, used with jitter for 72-hour forecast)
# ─────────────────────────────────────────────

def generate_aqi_dataset(n: int) -> pd.DataFrame:
    """Generate realistic India climate + pollution data."""
    temperature = np.random.normal(30, 8, n).clip(10, 48)
    humidity    = np.random.normal(60, 20, n).clip(15, 100)
    wind_speed  = np.random.exponential(10, n).clip(0, 50)
    pressure    = np.random.normal(1013, 8, n).clip(985, 1035)

    pollution_factor = (temperature / 35) * (1 - wind_speed / 60)
    pm25 = (np.random.normal(60, 40, n) * pollution_factor).clip(0, 500)
    pm10 = (pm25 * np.random.uniform(1.5, 2.5, n)).clip(0, 600)
    co   = (np.random.normal(0.8, 0.5, n) * pollution_factor).clip(0, 10)
    no2  = (np.random.normal(30, 20, n) * pollution_factor).clip(0, 400)
    so2  = (np.random.normal(15, 10, n) * pollution_factor).clip(0, 200)
    o3   = (np.random.normal(40, 20, n) * pollution_factor).clip(0, 300)

    def pm25_to_aqi(pm: np.ndarray) -> np.ndarray:
        aqi = np.zeros_like(pm)
        aqi = np.where(pm <= 30,  pm * (50/30), aqi)
        aqi = np.where((pm > 30) & (pm <= 60),  51 + (pm - 31) * (49/29), aqi)
        aqi = np.where((pm > 60) & (pm <= 90),  101 + (pm - 61) * (99/29), aqi)
        aqi = np.where((pm > 90) & (pm <= 120), 201 + (pm - 91) * (99/29), aqi)
        aqi = np.where((pm > 120) & (pm <= 250),301 + (pm - 121) * (99/129), aqi)
        aqi = np.where(pm > 250,   401 + (pm - 251) * (99/249), aqi)
        return aqi.clip(0, 500)

    aqi_now = pm25_to_aqi(pm25)
    trend   = np.random.normal(0, 15, n) - (wind_speed * 0.5)
    aqi_24h = (aqi_now + trend).clip(0, 500).round()

    return pd.DataFrame({
        "temperature": temperature,
        "humidity":    humidity,
        "wind_speed":  wind_speed,
        "pressure":    pressure,
        "pm25":        pm25,
        "pm10":        pm10,
        "co":          co,
        "no2":         no2,
        "so2":         so2,
        "o3":          o3,
        "aqi_24h":     aqi_24h,
    })


def train_aqi_model(df: pd.DataFrame):
    features = ["temperature", "humidity", "wind_speed", "pressure",
                "pm25", "pm10", "co", "no2", "so2", "o3"]
    X = df[features]
    y = df["aqi_24h"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestRegressor(n_estimators=200, max_depth=12, min_samples_split=5,
                                   random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    mae = mean_absolute_error(y_test, model.predict(X_test))
    r2  = r2_score(y_test, model.predict(X_test))
    print(f"[AQI Model]  MAE: {mae:.2f}  |  R²: {r2:.4f}")
    return model


# ─────────────────────────────────────────────
# 2. ECO SCORE MODEL (unchanged)
# ─────────────────────────────────────────────

TRANSPORT_MAP = {"walk": 0, "cycle": 1, "public": 2, "private": 3}
OUTDOOR_MAP   = {"low": 0, "medium": 1, "high": 2}


def generate_eco_dataset(n: int) -> pd.DataFrame:
    transport_modes = np.random.choice(list(TRANSPORT_MAP.keys()), n, p=[0.1, 0.1, 0.4, 0.4])
    outdoor_exp     = np.random.choice(list(OUTDOOR_MAP.keys()),   n, p=[0.3, 0.4, 0.3])
    ac_fan_hours    = np.random.uniform(0, 14, n)
    water_usage     = np.random.uniform(30, 300, n)
    waste_seg       = np.random.choice([0, 1], n, p=[0.4, 0.6])
    transport_enc   = np.array([TRANSPORT_MAP[t] for t in transport_modes])
    outdoor_enc     = np.array([OUTDOOR_MAP[o]   for o in outdoor_exp])

    BASE  = 55.0
    score = np.full(n, BASE)
    water_delta  = (135 - water_usage) / 10
    energy_delta = (6 - ac_fan_hours)
    score += np.clip(water_delta * 2, -15, 10)
    score += np.clip(energy_delta * 3, -20, 18)
    transport_bonus = np.where(transport_enc == 0, 12,
                      np.where(transport_enc == 1, 10,
                      np.where(transport_enc == 2,  6, -5)))
    score += transport_bonus
    score += np.where(waste_seg == 1, 5, -5)
    score += np.where(outdoor_enc == 2, 5, np.where(outdoor_enc == 1, 2, 0))
    score  = np.clip(score + np.random.normal(0, 3, n), 0, 100).round(1)

    return pd.DataFrame({
        "ac_fan_hours":  ac_fan_hours,
        "water_usage":   water_usage,
        "transport_enc": transport_enc,
        "outdoor_enc":   outdoor_enc,
        "waste_seg":     waste_seg,
        "eco_score":     score,
    })


def train_eco_model(df: pd.DataFrame):
    features = ["ac_fan_hours", "water_usage", "transport_enc", "outdoor_enc", "waste_seg"]
    X = df[features]; y = df["eco_score"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestRegressor(n_estimators=200, max_depth=10, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    mae = mean_absolute_error(y_test, model.predict(X_test))
    r2  = r2_score(y_test, model.predict(X_test))
    print(f"[EcoScore Model]  MAE: {mae:.2f}  |  R²: {r2:.4f}")
    return model


# ─────────────────────────────────────────────
# 3. TEMPERATURE HOURLY MODEL
# Features: temperature, humidity, wind_speed, pressure,
#           pm25, pm10, co, no2, so2, o3, hour_offset
# Target: temperature_future (°C, at hour_offset hours ahead)
# ─────────────────────────────────────────────

def generate_temp_dataset(n: int) -> pd.DataFrame:
    temperature = np.random.normal(30, 8, n).clip(10, 48)
    humidity    = np.random.normal(60, 20, n).clip(15, 100)
    wind_speed  = np.random.exponential(10, n).clip(0, 50)
    pressure    = np.random.normal(1013, 8, n).clip(985, 1035)
    pm25        = np.random.normal(60, 40, n).clip(0, 500)
    pm10        = (pm25 * np.random.uniform(1.5, 2.5, n)).clip(0, 600)
    co          = np.random.normal(0.8, 0.5, n).clip(0, 10)
    no2         = np.random.normal(30, 20, n).clip(0, 400)
    so2         = np.random.normal(15, 10, n).clip(0, 200)
    o3          = np.random.normal(40, 20, n).clip(0, 300)
    hour_offset = np.random.randint(1, 73, n)  # 1-72 hours ahead
    start_hour  = np.random.randint(0, 24, n)  # current hour of day

    # Diurnal cycle: peak around 14:00, trough around 04:00
    future_hour = (start_hour + hour_offset) % 24
    diurnal     = -5 * np.cos((future_hour - 14) * 2 * np.pi / 24)

    # Night cooling / day warming trend
    day_drift   = -0.3 * (hour_offset // 24)

    # Wind cooling effect
    wind_effect = -wind_speed * 0.05

    # Low humidity → higher temperature
    humidity_effect = -(humidity - 60) * 0.05

    temp_future = (temperature + diurnal + day_drift + wind_effect + humidity_effect
                   + np.random.normal(0, 1.5, n)).clip(5, 50)

    return pd.DataFrame({
        "temperature": temperature,
        "humidity":    humidity,
        "wind_speed":  wind_speed,
        "pressure":    pressure,
        "pm25":        pm25,
        "pm10":        pm10,
        "co":          co,
        "no2":         no2,
        "so2":         so2,
        "o3":          o3,
        "hour_offset": hour_offset,
        "temp_future": temp_future,
    })


def train_temp_model(df: pd.DataFrame):
    features = ["temperature", "humidity", "wind_speed", "pressure",
                "pm25", "pm10", "co", "no2", "so2", "o3", "hour_offset"]
    X = df[features]; y = df["temp_future"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestRegressor(n_estimators=150, max_depth=10, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    mae = mean_absolute_error(y_test, model.predict(X_test))
    r2  = r2_score(y_test, model.predict(X_test))
    print(f"[Temp Model]      MAE: {mae:.2f}°C  |  R²: {r2:.4f}")
    return model


# ─────────────────────────────────────────────
# 4. RAINFALL HOURLY MODEL
# Features: same 10 env features + hour_offset + start_hour
# Target: rain_probability (0–100%)
# ─────────────────────────────────────────────

def generate_rain_dataset(n: int) -> pd.DataFrame:
    temperature = np.random.normal(30, 8, n).clip(10, 48)
    humidity    = np.random.normal(60, 20, n).clip(15, 100)
    wind_speed  = np.random.exponential(10, n).clip(0, 50)
    pressure    = np.random.normal(1013, 8, n).clip(985, 1035)
    pm25        = np.random.normal(60, 40, n).clip(0, 500)
    pm10        = (pm25 * np.random.uniform(1.5, 2.5, n)).clip(0, 600)
    co          = np.random.normal(0.8, 0.5, n).clip(0, 10)
    no2         = np.random.normal(30, 20, n).clip(0, 400)
    so2         = np.random.normal(15, 10, n).clip(0, 200)
    o3          = np.random.normal(40, 20, n).clip(0, 300)
    hour_offset = np.random.randint(1, 73, n)
    start_hour  = np.random.randint(0, 24, n)

    future_hour = (start_hour + hour_offset) % 24

    # Base probability driven by humidity + low pressure
    base = (humidity - 40) * 1.2 + (1013 - pressure) * 0.8
    base = base.clip(0, 100)

    # Afternoon convection peak (14–18h local time)
    afternoon = np.where((future_hour >= 14) & (future_hour <= 18), 20, 0)

    # Wind dispersion reduces rain
    wind_reduction = -wind_speed * 0.3

    # Uncertainty grows with time horizon
    horizon_noise = np.random.normal(0, hour_offset * 0.15, n)

    prob = (base + afternoon + wind_reduction + horizon_noise).clip(0, 100)

    return pd.DataFrame({
        "temperature": temperature,
        "humidity":    humidity,
        "wind_speed":  wind_speed,
        "pressure":    pressure,
        "pm25":        pm25,
        "pm10":        pm10,
        "co":          co,
        "no2":         no2,
        "so2":         so2,
        "o3":          o3,
        "hour_offset": hour_offset,
        "rain_prob":   prob,
    })


def train_rain_model(df: pd.DataFrame):
    features = ["temperature", "humidity", "wind_speed", "pressure",
                "pm25", "pm10", "co", "no2", "so2", "o3", "hour_offset"]
    X = df[features]; y = df["rain_prob"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestRegressor(n_estimators=150, max_depth=10, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    mae = mean_absolute_error(y_test, model.predict(X_test))
    r2  = r2_score(y_test, model.predict(X_test))
    print(f"[Rain Model]      MAE: {mae:.2f}%  |  R²: {r2:.4f}")
    return model


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    print("=== EcoPulse ML Model Training ===\n")

    print("1/4  Generating AQI training data...")
    aqi_df    = generate_aqi_dataset(N)
    aqi_mdl   = train_aqi_model(aqi_df)
    joblib.dump(aqi_mdl, os.path.join(out_dir, "aqi_model.pkl"))
    print(f"     ✅  Saved aqi_model.pkl\n")

    print("2/4  Generating Eco Score training data...")
    eco_df    = generate_eco_dataset(N)
    eco_mdl   = train_eco_model(eco_df)
    joblib.dump(eco_mdl, os.path.join(out_dir, "eco_score_model.pkl"))
    print(f"     ✅  Saved eco_score_model.pkl\n")

    print("3/4  Generating Temperature Hourly training data...")
    temp_df   = generate_temp_dataset(N)
    temp_mdl  = train_temp_model(temp_df)
    joblib.dump(temp_mdl, os.path.join(out_dir, "temp_model.pkl"))
    print(f"     ✅  Saved temp_model.pkl\n")

    print("4/4  Generating Rainfall Hourly training data...")
    rain_df   = generate_rain_dataset(N)
    rain_mdl  = train_rain_model(rain_df)
    joblib.dump(rain_mdl, os.path.join(out_dir, "rain_model.pkl"))
    print(f"     ✅  Saved rain_model.pkl\n")

    print("=== Training complete! ===")
    print("All models saved to ml-model/")
    print("Run: cd ../backend && uvicorn main:app --reload")
