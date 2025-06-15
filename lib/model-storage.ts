import * as tf from "@tensorflow/tfjs"
import type { ProcessedData } from "./data-processing"

export interface SavedModelData {
  modelUrl: string
  scaler: {
    featureMean: number[]
    featureStd: number[]
    targetMean: number
    targetStd: number
  }
  metadata: {
    version: string
    trainedAt: string
    dataSize: number
    features: string[]
    topJobTitles: string[]
  }
}

const MODEL_STORAGE_KEY = "salary_prediction_model"
const MODEL_VERSION = "1.0.0"

export async function saveModelToStorage(model: tf.Sequential, scaler: any, data: ProcessedData): Promise<void> {
  try {
    console.log("Saving model to browser storage...")
    const modelUrl = "indexeddb://salary-prediction-model"
    await model.save(modelUrl)

    const modelData: SavedModelData = {
      modelUrl,
      scaler: {
        featureMean: Array.from(scaler.featureMean.dataSync()),
        featureStd: Array.from(scaler.featureStd.dataSync()),
        targetMean: scaler.targetMean,
        targetStd: scaler.targetStd,
      },
      metadata: {
        version: MODEL_VERSION,
        trainedAt: new Date().toISOString(),
        dataSize: data.rawData.length,
        features: data.featureNames,
        topJobTitles: data.topJobTitles,
      },
    }

    localStorage.setItem(MODEL_STORAGE_KEY, JSON.stringify(modelData))
    console.log("Model saved successfully to browser storage")
  } catch (error) {
    console.error("Error saving model:", error)
    throw error
  }
}

export async function loadModelFromStorage(): Promise<{
  model: tf.Sequential
  scaler: any
  metadata: SavedModelData["metadata"]
} | null> {
  try {
    console.log("Attempting to load model from browser storage...")
    const modelDataStr = localStorage.getItem(MODEL_STORAGE_KEY)
    if (!modelDataStr) {
      console.log("No saved model found in localStorage")
      return null
    }

    const modelData: SavedModelData = JSON.parse(modelDataStr)

    if (modelData.metadata.version !== MODEL_VERSION) {
      console.log("Model version mismatch, will retrain")
      return null
    }

    const model = (await tf.loadLayersModel(modelData.modelUrl)) as tf.Sequential
    if (!model) {
      console.log("Failed to load model from IndexedDB")
      return null
    }

    const scaler = {
      featureMean: tf.tensor1d(modelData.scaler.featureMean),
      featureStd: tf.tensor1d(modelData.scaler.featureStd),
      targetMean: modelData.scaler.targetMean,
      targetStd: modelData.scaler.targetStd,
    }

    console.log("Model loaded successfully from browser storage")
    return {
      model,
      scaler,
      metadata: modelData.metadata,
    }
  } catch (error) {
    console.error("Error loading model from storage:", error)
    localStorage.removeItem(MODEL_STORAGE_KEY)
    return null
  }
}

export async function loadModelFromPublic(): Promise<{
  model: tf.LayersModel
  scaler: any
  metadata: SavedModelData["metadata"]
} | null> {
  try {
    const model = await tf.loadLayersModel("/model/salary_prediction_model.json")

    const scalerRes = await fetch("/model/scaler.json")
    const scalerData = await scalerRes.json()

    const scaler = {
      featureMean: tf.tensor1d(scalerData.featureMean),
      featureStd: tf.tensor1d(scalerData.featureStd),
      targetMean: scalerData.targetMean,
      targetStd: scalerData.targetStd,
    }

    const metadata: SavedModelData["metadata"] = {
      version: MODEL_VERSION,
      trainedAt: scalerData.trainedAt || new Date().toISOString(),
      dataSize: scalerData.dataSize || 0,
      features: scalerData.features || [],
      topJobTitles: scalerData.topJobTitles || [],
    }

    console.log("Model loaded from public model files")
    return { model, scaler, metadata }
  } catch (error) {
    console.error("Error loading model from public folder:", error)
    return null
  }
}

export function clearSavedModel(): void {
  try {
    localStorage.removeItem(MODEL_STORAGE_KEY)
    console.log("Saved model data cleared")
  } catch (error) {
    console.error("Error clearing saved model:", error)
  }
}

export function getModelInfo(): SavedModelData["metadata"] | null {
  try {
    const modelDataStr = localStorage.getItem(MODEL_STORAGE_KEY)
    if (!modelDataStr) return null

    const modelData: SavedModelData = JSON.parse(modelDataStr)
    return modelData.metadata
  } catch (error) {
    console.error("Error getting model info:", error)
    return null
  }
}
