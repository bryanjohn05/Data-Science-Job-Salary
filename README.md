# Data Science Jobs Salary Predictor

A comprehensive Next.js dashboard that uses machine learning to predict salaries for data science jobs. Built with TensorFlow.js, the application provides interactive visualizations and real-time salary predictions based on job characteristics.

## 🚀 Features

### 📊 Interactive Dashboard
- **Real-time Data Visualization**: Multiple chart types showing salary trends, experience levels, locations, and company sizes
- **Comprehensive Analytics**: 4 main sections - Overview, Analysis, Predictions, and Trends
- **Responsive Design**: Fully responsive interface that works on desktop and mobile devices

### 🤖 Machine Learning Integration
- **TensorFlow.js Neural Network**: Advanced regression model with multiple hidden layers
- **Smart Caching**: Model persistence using IndexedDB for faster subsequent loads
- **Feature Engineering**: Intelligent encoding of categorical variables (job titles, experience levels, company sizes)
- **Real-time Predictions**: Instant salary predictions based on user inputs

### 📈 Data Analysis Features
- **Salary Trends Over Time**: Historical analysis from 2020-2024
- **Experience Level Breakdown**: Entry, Mid, Senior, and Executive level comparisons
- **Geographic Analysis**: Top-paying locations and regional salary differences
- **Company Size Impact**: How company size affects compensation
- **Remote Work Analysis**: Salary trends for on-site, hybrid, and remote positions
- **Employment Type Comparison**: Full-time, part-time, contract, and freelance analysis

### 🎯 Prediction System
- **Multi-factor Prediction**: Considers job title, experience level, company size, location, remote ratio, and work year
- **Market Comparison**: Compare predictions against filtered market data
- **Confidence Intervals**: Prediction ranges with statistical confidence
- **Interactive Filtering**: Real-time data filtering based on user selections

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS
- **Charts**: Recharts for data visualization
- **Machine Learning**: TensorFlow.js
- **Data Storage**: Browser IndexedDB and localStorage
- **Icons**: Lucide React

## 📦 Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd salary-prediction-dashboard
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   \`\`\`

3. **Run the development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   \`\`\`

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

\`\`\`
├── app/
│   ├── page.tsx                 # Main dashboard component
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── charts/                 # Chart components
│   │   ├── salary-trends-chart.tsx
│   │   ├── experience-level-chart.tsx
│   │   ├── location-salary-chart.tsx
│   │   ├── company-size-chart.tsx
│   │   └── yearly-trends-chart.tsx
│   └── prediction-form.tsx     # ML prediction interface
├── lib/
│   ├── data-processing.ts      # Data loading and processing
│   ├── ml-model.ts            # Machine learning model
│   ├── model-storage.ts       # Model persistence
│   └── utils.ts               # Utility functions
├── public/
│   └── dataset.csv            # Job data dataset
└── README.md
\`\`\`

## 🔧 Configuration

### Dataset
The application uses a CSV dataset containing job information with the following schema:
- \`work_year\`: Year of employment
- \`experience_level\`: EN (Entry), MI (Mid), SE (Senior), EX (Executive)
- \`employment_type\`: FT (Full-time), PT (Part-time), CT (Contract), FL (Freelance)
- \`job_title\`: Position name
- \`salary_in_usd\`: Annual salary in USD
- \`company_location\`: Company location
- \`company_size\`: S (Small), M (Medium), L (Large)
- \`remote_ratio\`: Percentage of remote work (0-100)

### Model Configuration
The neural network model includes:
- **Input Layer**: 6 features (year, experience, employment type, company size, remote ratio, job title)
- **Hidden Layers**: 256, 128, 64, 32 neurons with ReLU activation
- **Dropout Layers**: 30% and 20% dropout for regularization
- **Output Layer**: Single neuron for salary prediction
- **Optimizer**: Adam with 0.001 learning rate
- **Loss Function**: Mean Squared Error

## 🎮 Usage

### First Time Setup
1. **Initial Load**: The first time you visit, the app will train the ML model (1-2 minutes)
2. **Model Caching**: The trained model is saved to your browser for faster subsequent loads
3. **Data Processing**: The dataset is processed and statistics are calculated

### Making Predictions
1. Navigate to the **Predictions** tab
2. Select job parameters:
   - Job Title (from top 15 most common titles)
   - Experience Level (Entry, Mid, Senior, Executive)
   - Employment Type (Full-time, Part-time, Contract, Freelance)
   - Company Size (Small, Medium, Large)
   - Work Year (2020-2030)
   - Remote Work Ratio (0-100%)
3. Click **Predict Salary** to get results
4. View prediction with confidence intervals and market comparisons

### Exploring Data
- **Overview Tab**: Key statistics and primary visualizations
- **Analysis Tab**: Detailed breakdowns by company size and job titles
- **Trends Tab**: Historical analysis and employment trends

### Model Management
- **Retrain Model**: Use the "Retrain Model" button to train a fresh model
- **Clear Cache**: Clear saved model data if needed
- **Model Info**: View when the model was trained and on how much data

## 📊 Data Insights

The dashboard provides insights into:
- **Salary Growth**: Year-over-year salary trends in data science
- **Experience Premium**: How much more senior roles pay compared to entry-level
- **Location Impact**: Geographic salary differences and cost of living factors
- **Company Size Effect**: How startup vs enterprise compensation differs
- **Remote Work Premium**: Salary differences for remote vs on-site positions

## 🔄 Model Performance

The machine learning model achieves:
- **Feature Engineering**: Categorical encoding and normalization
- **Regularization**: L2 regularization and dropout to prevent overfitting
- **Validation**: 20% validation split during training
- **Caching**: Persistent model storage for production efficiency

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with default settings
4. The app will be available at your Vercel URL

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Render

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Dataset**: Data science jobs dataset from Kaggle
- **UI Components**: shadcn/ui for beautiful, accessible components
- **Charts**: Recharts for responsive data visualizations
- **ML Framework**: TensorFlow.js for in-browser machine learning
- **Icons**: Lucide React for consistent iconography

## 📞 Support

If you encounter any issues or have questions:
1. Check the browser console for error messages
2. Try clearing the model cache using the "Clear Cache & Retry" button
3. Ensure your browser supports modern JavaScript features
4. Open an issue on GitHub with detailed information

## 🔮 Future Enhancements

- [ ] Additional ML models (Random Forest, XGBoost comparison)
- [ ] More detailed location analysis with cost of living adjustments
- [ ] Skills-based salary prediction
- [ ] Industry-specific analysis
- [ ] Export functionality for charts and predictions
- [ ] Real-time data updates
- [ ] Advanced filtering and search capabilities
- [ ] Mobile app version

---

**Built with ❤️ using Next.js and TensorFlow.js**
