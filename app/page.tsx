"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, DollarSign, MapPin, AlertCircle, RefreshCw, Database } from "lucide-react"
import { SalaryTrendsChart } from "@/components/charts/salary-trends-chart"
import { ExperienceLevelChart } from "@/components/charts/experience-level-chart"
import { LocationSalaryChart } from "@/components/charts/location-salary-chart"
import { CompanySizeChart } from "@/components/charts/company-size-chart"
import { YearlyTrendsChart } from "@/components/charts/yearly-trends-chart"
import { PredictionForm } from "@/components/prediction-form"
import { loadAndProcessData, type ProcessedData } from "@/lib/data-processing"
import { getOrTrainModel, type MLModel } from "@/lib/ml-model"
import { getModelInfo, clearSavedModel, loadModelFromStorage } from "@/lib/model-storage"
import Link from "next/link"

export default function Dashboard() {
  const [data, setData] = useState<ProcessedData | null>(null)
  const [model, setModel] = useState<MLModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [isTrainingModel, setIsTrainingModel] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleDownloadModel = async () => {
  try {
    const loaded = await loadModelFromStorage()
    if (!loaded) {
      console.error("No saved model found.")
      return
    }

    const { model, scaler } = loaded

    // Download the model as JSON + BIN
    await model.save("downloads://salary_prediction_model")

    // Download scaler as JSON
    const scalerToDownload = {
      featureMean: Array.from(scaler.featureMean.dataSync()),
      featureStd: Array.from(scaler.featureStd.dataSync()),
      targetMean: scaler.targetMean,
      targetStd: scaler.targetStd,
    }

    const blob = new Blob([JSON.stringify(scalerToDownload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "scaler.json"
    a.click()
  } catch (error) {
    console.error("Error downloading model:", error)
  }
}

  const handleRetrainModel = async () => {
    if (!data) return

    try {
      setIsTrainingModel(true)
      clearSavedModel()
      const newModel = await getOrTrainModel(data)
      setModel(newModel)
    } catch (err) {
      console.error("Error retraining model:", err)
      setError(err instanceof Error ? err.message : "Failed to retrain model")
    } finally {
      setIsTrainingModel(false)
    }
  }

  useEffect(() => {
    async function initializeApp() {
      try {
        setLoading(true)
        setError(null)

        console.log("Loading and processing data...")
        const processedData = await loadAndProcessData()
        console.log("Data loaded successfully:", {
          totalRecords: processedData.rawData.length,
          features: processedData.features.length,
          featureCount: processedData.features[0]?.length || 0,
          experienceStats: processedData.experienceStats,
          yearlyStats: processedData.yearlyStats,
        })
        setData(processedData)

        const modelInfo = getModelInfo()
        if (!modelInfo) {
          console.log("No saved model found, training new model...")
          setIsTrainingModel(true)
        } else {
          console.log("Found saved model:", modelInfo)
        }

        const trainedModel = await getOrTrainModel(processedData)
        console.log("Model ready:", trainedModel.metadata ? "Loaded from storage" : "Newly trained")
        setModel(trainedModel)

        console.log("App initialized successfully")
      } catch (err) {
        console.error("Error initializing app:", err)
        const errorMessage = err instanceof Error ? err.message : "Failed to initialize application"
        setError(errorMessage)
      } finally {
        setLoading(false)
        setIsTrainingModel(false)
      }
    }

    initializeApp()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()} variant="default">
                Retry
              </Button>
              <Button
                onClick={() => {
                  clearSavedModel()
                  window.location.reload()
                }}
                variant="outline"
              >
                Clear Cache & Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Only show loading UI when model is specifically training (not during initial load/refresh)
  if (data && !model && isTrainingModel) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Data Science Jobs Salary Predictor</h1>
            <p className="text-muted-foreground text-lg">
              Interactive dashboard with ML-powered salary predictions and comprehensive job market analysis
            </p>
            <div className="mt-4 text-sm text-muted-foreground">Training machine learning model...</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Don't render anything if data or model is not ready (during refresh/initial load)
  if (!data || !model) {
    return null
  }

  const stats = {
    totalJobs: new Set(data.rawData.map((job) => job.job_title)).size,
    avgSalary: Math.round(data.rawData.reduce((sum, job) => sum + job.salary_in_usd, 0) / data.rawData.length),
    uniqueCompanies: new Set(data.rawData.map((job) => job.company_location)).size,
    topLocation: data.locationStats[0]?.location || "N/A",
  }

  const modelInfo = getModelInfo()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">Data Science Jobs Salary Predictor</h1>
              <p className="text-muted-foreground text-lg">
                Interactive dashboard with ML-powered salary predictions and comprehensive job market analysis
              </p>
              <div className="mt-4 text-sm text-muted-foreground">
                Dataset: {stats.totalJobs} jobs • Charts: {data.experienceStats.length} experience levels •{" "}
                {data.yearlyStats.length} years
              </div>
              
              <div className="hover:text-blue-600">
                  <Link href="https://github.com/bryanjohn05/Data-Analyst-Jobs/blob/main/public/dataset.csv">View Dataset</Link>
              </div>
            </div>
            <div className="text-right">
              {modelInfo && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
                    <Database className="h-4 w-4" />
                    Model Cached
                  </div>
                  <div className="text-xs text-green-600">
                    Trained: {new Date(modelInfo.trainedAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-green-600">
                    Data: {new Set(data.rawData.map((job) => job.job_title)).size} jobs
                  </div>
                </div>
              )}
              {/* <Button onClick={handleRetrainModel} variant="outline" size="sm" disabled={isTrainingModel}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isTrainingModel ? "animate-spin" : ""}`} />
                {isTrainingModel ? "Training..." : "Retrain Model"}
              </Button>
              <Button onClick={handleDownloadModel} variant="outline" size="sm" className="mt-2">
                  Download Trained Model
              </Button> */}

              
            </div>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalJobs.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Job listings analyzed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.avgSalary.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">USD per year</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Locations</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueCompanies}</div>
              <p className="text-xs text-muted-foreground">Global locations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Location</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.topLocation}</div>
              <p className="text-xs text-muted-foreground">Most job opportunities</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Salary Distribution by Experience Level</CardTitle>
                  <CardDescription>
                    Average salaries across different experience levels ({data.experienceStats.length} levels)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExperienceLevelChart data={data.experienceStats} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Paying Locations</CardTitle>
                  <CardDescription>
                    Average salaries by company location (top 10 of {data.locationStats.length})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LocationSalaryChart data={data.locationStats.slice(0, 10)} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Salary Trends Over Time</CardTitle>
                <CardDescription>Historical salary trends ({data.yearlyStats.length} years of data)</CardDescription>
              </CardHeader>
              <CardContent>
                <SalaryTrendsChart data={data.yearlyStats} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Size Impact</CardTitle>
                  <CardDescription>
                    How company size affects salary ranges ({data.companySizeStats.length} size categories)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CompanySizeChart data={data.companySizeStats} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Job Title Distribution</CardTitle>
                  <CardDescription>Most common job titles in the dataset</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.jobTitleStats.slice(0, 8).map((item, index) => (
                      <div key={item.title} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="font-medium text-sm">{item.title}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm">{item.count} jobs</div>
                          <div className="text-xs text-muted-foreground">${item.avgSalary.toLocaleString()} avg</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ML-Powered Salary Prediction</CardTitle>
                <CardDescription>
                  Use our trained model to predict salaries based on job characteristics
                  {/* {model.metadata && (
                    <span className="block mt-1 text-xs text-green-600">
                      Using cached model trained on {model.metadata.dataSize} jobs
                    </span>
                  )} */}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PredictionForm model={model} data={data} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Yearly Salary Trends</CardTitle>
                <CardDescription>Detailed analysis of salary evolution over time</CardDescription>
              </CardHeader>
              <CardContent>
                <YearlyTrendsChart data={data.yearlyStats} />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Remote Work Trends</CardTitle>
                  <CardDescription>{data.remoteStats.length} remote work categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.remoteStats.map((item) => (
                      <div key={item.ratio} className="flex items-center justify-between">
                        <span className="font-medium">
                          {item.ratio === 0
                            ? "On-site"
                            : item.ratio === 50
                              ? "Hybrid"
                              : item.ratio === 100
                                ? "Fully Remote"
                                : `${item.ratio}% Remote`}
                        </span>
                        <div className="text-right">
                          <div className="font-semibold">{item.count} jobs</div>
                          <div className="text-sm text-muted-foreground">${item.avgSalary.toLocaleString()} avg</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Employment Type Distribution</CardTitle>
                  <CardDescription>{data.employmentStats.length} employment types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.employmentStats.map((item) => (
                      <div key={item.type} className="flex items-center justify-between">
                        <span className="font-medium">
                          {item.type === "FT"
                            ? "Full-time"
                            : item.type === "PT"
                              ? "Part-time"
                              : item.type === "CT"
                                ? "Contract"
                                : item.type === "FL"
                                  ? "Freelance"
                                  : item.type}
                        </span>
                        <div className="text-right">
                          <div className="font-semibold">{item.count} jobs</div>
                          <div className="text-sm text-muted-foreground">${item.avgSalary.toLocaleString()} avg</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
