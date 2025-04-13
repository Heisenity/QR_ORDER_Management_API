import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import pymongo
from datetime import datetime, timedelta

import certifi

client = pymongo.MongoClient(
    "mongodb+srv://sensayantan9991:EETaa7hbOUQcjVDJ@qr-order-db.a02fd.mongodb.net/",
    tls=True,
    tlsCAFile=certifi.where()
)
db = client["test"]  # Replace with your actual database name


# --- Connect to MongoDB Atlas ---
#client = pymongo.MongoClient("mongodb+srv://sensayantan9991:EETaa7hbOUQcjVDJ@qr-order-db.a02fd.mongodb.net/")
#db = client["test"]  # Replace with your actual database name
orders_collection = db["orders"]
inventory_collection = db["inventories"]

# --- Fetch order history ---
orders = list(orders_collection.find({}, {"_id": 0, "items": 1, "createdAt": 1}))
print("📌 Fetched Orders:", orders)

if not orders:
    print("⚠ No orders found in the database!")
    exit()

# --- Prepare data for AI model ---
order_data = []
for order in orders:
    if "createdAt" in order and "items" in order:
        try:
            # Attempt to parse timestamp with milliseconds
            date_obj = datetime.strptime(order["createdAt"], "%Y-%m-%dT%H:%M:%S.%fZ")
        except ValueError:
            # Fall back if milliseconds are missing
            date_obj = datetime.strptime(order["createdAt"], "%Y-%m-%dT%H:%M:%SZ")
        date_str = date_obj.strftime("%Y-%m-%d")
        for item in order["items"]:
            order_data.append({
                "date": date_str,
                "item": item["name"],
                "quantity": item["quantity"]
            })
    else:
        print("⚠ Skipping order due to missing fields:", order)

# --- Convert data into a DataFrame ---
df = pd.DataFrame(order_data)
print("📊 DataFrame before processing:\n", df)

if "date" not in df.columns:
    print("❌ Error: 'date' column is missing in the dataset!")
    exit()

# Convert date column to datetime
df["date"] = pd.to_datetime(df["date"])

# Aggregate orders per day and item
df = df.groupby(["date", "item"]).sum().reset_index()

# --- Feature Engineering ---
df["day_of_week"] = df["date"].dt.dayofweek  # Monday = 0, Sunday = 6
df["is_weekend"] = df["day_of_week"].apply(lambda x: 1 if x >= 5 else 0)
df["days_since_start"] = (df["date"] - df["date"].min()).dt.days

# --- Train Random Forest Model for Each Item ---
predictions = {}
for item in df["item"].unique():
    item_df = df[df["item"] == item].copy()
    
    # Prepare features (X) and target (y)
    X = item_df[["days_since_start", "day_of_week", "is_weekend"]]
    y = item_df["quantity"]
    
    # Train the Random Forest model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    # Predict demand for the next 7 days
    future_days = np.array([item_df["days_since_start"].max() + i for i in range(1, 8)])
    future_dates = [df["date"].max() + timedelta(days=i) for i in range(1, 8)]
    future_weekdays = [d.weekday() for d in future_dates]
    future_is_weekend = [1 if wd >= 5 else 0 for wd in future_weekdays]
    
    future_X = np.column_stack((future_days, future_weekdays, future_is_weekend))
    pred = model.predict(future_X)
    predictions[item] = int(sum(pred))

# --- Compare Predictions Against Inventory ---
for item, pred_demand in predictions.items():
    inventory = inventory_collection.find_one({"ingredientName": item})
    if inventory:
        stock = inventory["stockLevel"]
        if stock < pred_demand:
            print(f"⚠ Alert: {item} stock is low! Predicted demand: {pred_demand} units, Current stock: {stock}")
    else:
        print(f"❗ Warning: No inventory record found for {item}!")

# --- Final Predictions ---
print("✅ AI Stock Predictions:", predictions)
