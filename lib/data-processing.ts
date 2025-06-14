export interface JobData {
  work_year: number
  experience_level: string
  employment_type: string
  job_title: string
  salary: number
  salary_currency: string
  salary_in_usd: number
  employee_residence: string
  remote_ratio: number
  company_location: string
  company_size: string
}

// Update the ProcessedData interface to include topJobTitles
export interface ProcessedData {
  rawData: JobData[]
  experienceStats: Array<{ level: string; avgSalary: number; count: number }>
  locationStats: Array<{ location: string; avgSalary: number; count: number }>
  yearlyStats: Array<{ year: number; avgSalary: number; count: number }>
  companySizeStats: Array<{ size: string; avgSalary: number; count: number }>
  jobTitleStats: Array<{ title: string; avgSalary: number; count: number }>
  remoteStats: Array<{ ratio: number; avgSalary: number; count: number }>
  employmentStats: Array<{ type: string; avgSalary: number; count: number }>
  features: number[][]
  targets: number[]
  featureNames: string[]
  topJobTitles: string[]
}

function parseCSV(csvText: string): JobData[] {
  const lines = csvText.trim().split("\n")
  const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())

  return lines
    .slice(1)
    .map((line) => {
      const values = []
      let current = ""
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          values.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      values.push(current.trim())

      const row: any = {}
      headers.forEach((header, index) => {
        const value = values[index]?.replace(/"/g, "") || ""

        switch (header) {
          case "work_year":
          case "salary":
          case "salary_in_usd":
          case "remote_ratio":
            row[header] = Number.parseInt(value) || 0
            break
          default:
            row[header] = value
        }
      })

      return row as JobData
    })
    .filter((row) => row.salary_in_usd > 0 && row.work_year >= 2020)
}

function calculateStats<T>(
  data: JobData[],
  groupBy: (item: JobData) => T,
  keyName: string,
): Array<{ [key: string]: any; avgSalary: number; count: number }> {
  const groups = new Map<T, { salaries: number[]; count: number }>()

  data.forEach((item) => {
    const key = groupBy(item)
    if (!groups.has(key)) {
      groups.set(key, { salaries: [], count: 0 })
    }
    const group = groups.get(key)!
    group.salaries.push(item.salary_in_usd)
    group.count++
  })

  return Array.from(groups.entries())
    .map(([key, { salaries, count }]) => ({
      [keyName]: key,
      avgSalary: Math.round(salaries.reduce((sum, sal) => sum + sal, 0) / salaries.length),
      count,
    }))
    .sort((a, b) => b.avgSalary - a.avgSalary)
}

function createFeatures(data: JobData[]): {
  features: number[][]
  targets: number[]
  featureNames: string[]
  topJobTitles: string[]
} {
  const experienceLevels = ["EN", "MI", "SE", "EX"]
  const employmentTypes = ["FT", "PT", "CT", "FL"]
  const companySizes = ["S", "M", "L"]

  // Get top job titles for encoding
  const jobTitleCounts = new Map<string, number>()
  data.forEach((job) => {
    jobTitleCounts.set(job.job_title, (jobTitleCounts.get(job.job_title) || 0) + 1)
  })

  const topJobTitles = Array.from(jobTitleCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([title]) => title)

  const features: number[][] = []
  const targets: number[] = []

  data.forEach((job) => {
    const feature = [
      job.work_year - 2020, // Normalize year
      experienceLevels.indexOf(job.experience_level),
      employmentTypes.indexOf(job.employment_type),
      companySizes.indexOf(job.company_size),
      job.remote_ratio / 100, // Normalize to 0-1
      topJobTitles.indexOf(job.job_title), // Job title encoding
    ]

    features.push(feature)
    targets.push(job.salary_in_usd)
  })

  const featureNames = [
    "work_year_normalized",
    "experience_level_encoded",
    "employment_type_encoded",
    "company_size_encoded",
    "remote_ratio_normalized",
    "job_title_encoded",
  ]

  return { features, targets, featureNames, topJobTitles }
}

// Update the loadAndProcessData function to include topJobTitles
export async function loadAndProcessData(): Promise<ProcessedData> {
  try {
    console.log("Fetching dataset...")
    const response = await fetch("/dataset.csv")
    if (!response.ok) {
      throw new Error(`Failed to fetch dataset: ${response.status} ${response.statusText}`)
    }

    const csvText = await response.text()
    console.log(`CSV file size: ${csvText.length} characters`)

    if (!csvText || csvText.trim().length === 0) {
      throw new Error("Dataset file is empty")
    }

    const rawData = parseCSV(csvText)
    console.log(`Parsed ${rawData.length} raw records`)

    if (rawData.length === 0) {
      throw new Error("No valid data found in dataset")
    }

    // Filter out invalid records
    const validData = rawData.filter(
      (job) =>
        job.salary_in_usd > 0 &&
        job.work_year >= 2020 &&
        job.experience_level &&
        job.employment_type &&
        job.company_size &&
        job.job_title,
    )

    console.log(`Filtered to ${validData.length} valid records`)

    if (validData.length < 10) {
      throw new Error("Insufficient valid data for analysis")
    }

    const experienceStats = calculateStats(validData, (job) => job.experience_level, "level")
    const locationStats = calculateStats(validData, (job) => job.company_location, "location")
    const yearlyStats = calculateStats(validData, (job) => job.work_year, "year")
    const companySizeStats = calculateStats(validData, (job) => job.company_size, "size")
    const jobTitleStats = calculateStats(validData, (job) => job.job_title, "title")
    const remoteStats = calculateStats(validData, (job) => job.remote_ratio, "ratio")
    const employmentStats = calculateStats(validData, (job) => job.employment_type, "type")

    const { features, targets, featureNames, topJobTitles } = createFeatures(validData)

    console.log(`Created ${features.length} feature vectors with ${features[0]?.length || 0} features each`)

    return {
      rawData: validData,
      experienceStats,
      locationStats,
      yearlyStats,
      companySizeStats,
      jobTitleStats,
      remoteStats,
      employmentStats,
      features,
      targets,
      featureNames,
      topJobTitles,
    }
  } catch (error) {
    console.error("Error loading and processing data:", error)
    throw new Error(`Data processing failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
