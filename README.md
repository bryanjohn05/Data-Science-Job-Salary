# 🧠 Data Science Jobs Salary Predictor

An interactive, machine learning-powered web dashboard to analyze and predict salaries for data science jobs across experience levels, job roles, company sizes, and more. Built using **React + TensorFlow.js**, it provides salary insights, market trends, and real-time salary predictions using a trained ML model.

---

## ✨ Features

- 📊 Visual analytics of job market data (experience, locations, company size, trends)
- 🤖 Salary prediction using a trained TensorFlow.js model
- 💾 Persistent model saved across browser sessions
- 🌍 Public model loading for cross-browser compatibility
- 📥 Download trained model + scaler as JSON
- ⚙️ Retrain model in-browser with new data
- 📈 Confidence intervals and market comparison

---

## 🚀 Getting Started

### 1. Clone the repo

```
git clone https://github.com/your-username/salary-predictor-app.git
cd salary-predictor-app
```

### 2. Install dependencies

```
npm install
# or
yarn install
```

### 3. Run the app

```
npm run dev
# or
yarn dev
```

Navigate to `http://localhost:3000`.

---




## 🧠 Model Persistence Strategy

| Source             | Use Case                            | Details                        |
|--------------------|--------------------------------------|--------------------------------|
| `indexeddb://`     | Local storage                        | Saved automatically after training |
| `/public/model/`   | Cross-browser, universal access      | Used as default load path      |
| `scaler.json`      | Contains normalization info          | Required to reverse predictions |

---

## 🧪 Model Prediction Logic

The prediction form:
- Encodes categorical values as indices
- Normalizes features using `scaler.featureMean` and `scaler.featureStd`
- Calls `model.predict(...)` and denormalizes the result

```ts
const normalized = input.sub(mean).div(std)
const output = model.predict(normalized)
const salary = output * targetStd + targetMean
```

---

## 📤 Export / Download Model (currently commented out)

You can download:
- `salary_prediction_model.json`
- `salary_prediction_model.weights.bin`
- `scaler.json`

To do this:
1. Click **"Download Trained Model"** on the dashboard. 
2. Files will be downloaded to your browser.
3. Copy them into `/public/model/` for reuse.

---

## 🔄 Retraining (currently commented out)

Use **"Retrain Model"** to:  
- Re-train the ML model using in-browser TensorFlow.js
- Overwrite cached model in IndexedDB
- Save updated model locally

---

## ✅ Requirements

- Node.js >= 16
- Modern browser with IndexedDB support

---

## 📚 Tech Stack

- ✅ React / Next.js
- ✅ TailwindCSS + Lucide icons
- ✅ TensorFlow.js
- ✅ TypeScript
- ✅ IndexedDB / LocalStorage / Static Assets

---

