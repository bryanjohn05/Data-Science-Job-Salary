import type { ProcessedData } from "./data-processing"
import * as tf from "@tensorflow/tfjs"
import { loadModelFromStorage, loadModelFromPublic, saveModelToStorage } from "./model-storage"

export interface MLModel {
  model: tf.LayersModel
  scaler: {
    featureMean: tf.Tensor1D
    featureStd: tf.Tensor1D
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

// Replace with your actual training logic
async function trainModel(data: ProcessedData): Promise<{
  model: tf.Sequential
  scaler: MLModel["scaler"]
}> {
  const model = tf.sequential()
  model.add(tf.layers.dense({ inputShape: [data.features[0].length], units: 64, activation: "relu" }))
  model.add(tf.layers.dense({ units: 32, activation: "relu" }))
  model.add(tf.layers.dense({ units: 1 }))

  model.compile({ loss: "meanSquaredError", optimizer: "adam" })

  const featureTensor = tf.tensor2d(data.features)
  const targetTensor = tf.tensor1d(data.targets)

  const featureMean = tf.mean(featureTensor, 0)
  const featureStd = tf.moments(featureTensor, 0).variance.sqrt()
  const normalizedFeatures = featureTensor.sub(featureMean).div(featureStd)

  const targetMean = targetTensor.mean().dataSync()[0]
  const targetStd = tf.moments(targetTensor).variance.sqrt().dataSync()[0]
  const normalizedTargets = targetTensor.sub(targetMean).div(targetStd)

  await model.fit(normalizedFeatures, normalizedTargets, {
    batchSize: 32,
    epochs: 30,
    shuffle: true,
  })

  return {
    model,
    scaler: {
      featureMean,
      featureStd,
      targetMean,
      targetStd,
    },
  }
}

export async function getOrTrainModel(data: ProcessedData): Promise<MLModel> {
  // Try loading from public model folder first
  const fromPublic = await loadModelFromPublic()
  if (fromPublic) {
    return {
      model: fromPublic.model,
      scaler: fromPublic.scaler,
      metadata: fromPublic.metadata,
    }
  }

  // Fallback to local IndexedDB
  const fromStorage = await loadModelFromStorage()
  if (fromStorage) {
    return {
      model: fromStorage.model,
      scaler: fromStorage.scaler,
      metadata: fromStorage.metadata,
    }
  }

  // Final fallback: train a new model
  console.log("No existing model found. Training new model...")
  const { model, scaler } = await trainModel(data)
  await saveModelToStorage(model, scaler, data)

  return {
    model,
    scaler,
    metadata: {
      version: "1.0.0",
      trainedAt: new Date().toISOString(),
      dataSize: data.rawData.length,
      features: data.featureNames,
      topJobTitles: data.topJobTitles,
    },
  }
}
