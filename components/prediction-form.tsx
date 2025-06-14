"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, Calendar, Users, MapPin, Briefcase, Filter } from "lucide-react"
import type { MLModel } from "@/lib/ml-model"
import type { ProcessedData } from "@/lib/data-processing"

interface PredictionFormProps {
  model: MLModel
  data: ProcessedData
}

export function PredictionForm({ model, data }: PredictionFormProps) {
  const [workYear, setWorkYear] = useState(2024)
  const [experienceLevel, setExperienceLevel] = useState("")
  const [employmentType, setEmploymentType] = useState("")
  const [companySize, setCompanySize] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [remoteRatio, setRemoteRatio] = useState([50])
  const [prediction, setPrediction] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [filteredData, setFilteredData] = useState(data.rawData)

  // Filter data based on selections
  const filteredStats = useMemo(() => {
    let filtered = data.rawData

    if (jobTitle) {
      filtered = filtered.filter((job) => job.job_title === jobTitle)
    }
    if (experienceLevel) {
      filtered = filtered.filter((job) => job.experience_level === experienceLevel)
    }
    if (employmentType) {
      filtered = filtered.filter((job) => job.employment_type === employmentType)
    }
    if (companySize) {
      filtered = filtered.filter((job) => job.company_size === companySize)
    }

    const avgSalary =
      filtered.length > 0 ? filtered.reduce((sum, job) => sum + job.salary_in_usd, 0) / filtered.length : 0

    return {
      count: filtered.length,
      avgSalary: Math.round(avgSalary),
      minSalary: filtered.length > 0 ? Math.min(...filtered.map((job) => job.salary_in_usd)) : 0,
      maxSalary: filtered.length > 0 ? Math.max(...filtered.map((job) => job.salary_in_usd)) : 0,
    }
  }, [data.rawData, jobTitle, experienceLevel, employmentType, companySize])

  const experienceLevels = [
    { value: "EN", label: "Entry-level / Junior", description: "0-2 years experience" },
    { value: "MI", label: "Mid-level / Intermediate", description: "2-5 years experience" },
    { value: "SE", label: "Senior-level / Expert", description: "5+ years experience" },
    { value: "EX", label: "Executive-level / Director", description: "8+ years experience" },
  ]

  const employmentTypes = [
    { value: "FT", label: "Full-time", description: "Standard full-time employment" },
    { value: "PT", label: "Part-time", description: "Part-time employment" },
    { value: "CT", label: "Contract", description: "Contract-based work" },
    { value: "FL", label: "Freelance", description: "Freelance/consulting work" },
  ]

  const companySizes = [
    { value: "S", label: "Small", description: "Less than 50 employees" },
    { value: "M", label: "Medium", description: "50-250 employees" },
    { value: "L", label: "Large", description: "250+ employees" },
  ]

  const handlePredict = async () => {
    if (!experienceLevel || !employmentType || !companySize || !jobTitle) {
      alert("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      const experienceLevels = ["EN", "MI", "SE", "EX"]
      const employmentTypes = ["FT", "PT", "CT", "FL"]
      const companySizes = ["S", "M", "L"]

      const features = [
        workYear - 2020, // Normalized year
        experienceLevels.indexOf(experienceLevel),
        employmentTypes.indexOf(employmentType),
        companySizes.indexOf(companySize),
        remoteRatio[0] / 100, // Normalized remote ratio
        data.topJobTitles.indexOf(jobTitle), // Job title encoding
      ]

      const predictedSalary = await model.predict(features)
      setPrediction(Math.round(predictedSalary))
    } catch (error) {
      console.error("Prediction error:", error)
      alert("Error making prediction. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceRange = (basePrediction: number) => {
    const variance = basePrediction * 0.15 // 15% variance
    return {
      low: Math.round(basePrediction - variance),
      high: Math.round(basePrediction + variance),
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Job Configuration
            </CardTitle>
            <CardDescription>Configure the job parameters for salary prediction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Title *</Label>
                <Select value={jobTitle} onValueChange={setJobTitle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job title" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.jobTitleStats.slice(0, 50).map((job) => (
                      <SelectItem key={job.title} value={job.title}>
                        <div>
                          <div className="font-medium">{job.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {job.count} jobs • ${job.avgSalary.toLocaleString()} avg
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Experience Level *</Label>
                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div>
                          <div className="font-medium">{level.label}</div>
                          <div className="text-xs text-muted-foreground">{level.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Employment Type *</Label>
                <Select value={employmentType} onValueChange={setEmploymentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {employmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Company Size *</Label>
                <Select value={companySize} onValueChange={setCompanySize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    {companySizes.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        <div>
                          <div className="font-medium">{size.label}</div>
                          <div className="text-xs text-muted-foreground">{size.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Work Year: {workYear}
                </Label>
                <Slider
                  value={[workYear]}
                  onValueChange={(value) => setWorkYear(value[0])}
                  min={2020}
                  max={2030}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>2020</span>
                  <span>2030</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Remote Work Ratio: {remoteRatio[0]}%
                </Label>
                <Slider
                  value={remoteRatio}
                  onValueChange={setRemoteRatio}
                  min={0}
                  max={100}
                  step={25}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>On-site</span>
                  <span>Hybrid</span>
                  <span>Remote</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handlePredict}
              disabled={loading || !experienceLevel || !employmentType || !companySize || !jobTitle}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Predicting...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Predict Salary
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
         
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Market Data
              </CardTitle>
              <CardDescription>Based on your current filters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-semibold text-blue-700">{filteredStats.count}</div>
                  <div className="text-xs text-blue-600">Jobs Found</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-semibold text-green-700">
                    ${filteredStats.avgSalary.toLocaleString()}
                  </div>
                  <div className="text-xs text-green-600">Avg Salary</div>
                </div>
              </div>

              {filteredStats.count > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Salary Range:</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${filteredStats.minSalary.toLocaleString()} - ${filteredStats.maxSalary.toLocaleString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card> */}

          {/* Prediction Results Card */}
          <Card>
            <CardHeader>
              <CardTitle>Prediction Results</CardTitle>
              <CardDescription>ML-powered salary prediction</CardDescription>
            </CardHeader>
            <CardContent>
              {prediction !== null ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">${prediction.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Predicted Annual Salary (USD)</div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium">Confidence Range</span>
                      <span className="text-sm">
                        ${getConfidenceRange(prediction).low.toLocaleString()} - $
                        {getConfidenceRange(prediction).high.toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-semibold text-green-700">
                          ${Math.round(prediction / 12).toLocaleString()}
                        </div>
                        <div className="text-xs text-green-600">Monthly</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-semibold text-blue-700">
                          ${Math.round(prediction / 2080).toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-600">Hourly</div>
                      </div>
                    </div>
                  </div>

                  {filteredStats.avgSalary > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">vs Market Average</Label>
                      <div className="flex justify-between items-center text-sm">
                        <span>Filtered Market Data</span>
                        <Badge variant={prediction > filteredStats.avgSalary ? "default" : "secondary"}>
                          {prediction > filteredStats.avgSalary ? "+" : ""}
                          {(((prediction - filteredStats.avgSalary) / filteredStats.avgSalary) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configure job parameters and click "Predict Salary" to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
