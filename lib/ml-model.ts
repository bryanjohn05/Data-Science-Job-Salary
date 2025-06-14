import * as tf from "@tensorflow/tfjs"
import type { ProcessedData } from "./data-processing"
import { saveModelToStorage, loadModelFromStorage } from "./model-storage"

export interface MLModel {
  model: tf.Sequential
  scaler: {
    featureMean: tf.Tensor
    featureStd: tf.Tensor
    targetMean: number
    targetStd: number
  }
  predict: (features: number[]) => Promise<number>
  predictBatch: (features: number[][]) => Promise<number[]>
  metadata?: {
    version: string
    trainedAt: string
    dataSize: number
    features: string[]
    topJobTitles: string[]
  }
}

function createModel(inputShape: number): tf.Sequential {
  const model = tf.sequential({
    layers: [
      tf.layers.dense({
        inputShape: [inputShape],
        units: 256,
        activation: "relu",
        kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
      }),
      tf.layers.dropout({ rate: 0.3 }),
      tf.layers.dense({
        units: 128,
        activation: "relu",
        kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
      }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({
        units: 64,
        activation: "relu",
      }),
      tf.layers.dense({
        units: 32,
        activation: "relu",
      }),
      tf.layers.dense({
        units: 1,
        activation: "linear",
      }),
    ],
  })

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: "meanSquaredError",
    metrics: [tf.metrics.meanAbsoluteError],
  })

  return model
}

async function trainNewModel(data: ProcessedData): Promise<MLModel> {
  console.log("Training new model...")

  try {
    // Convert to tensors
    const featureTensor = tf.tensor2d(data.features)
    const targetTensor = tf.tensor1d(data.targets)

    console.log(`Training data shape: features ${featureTensor.shape}, targets ${targetTensor.shape}`)

    // Normalize features
    const featureMean = featureTensor.mean(0)
    const featureStd = featureTensor.sub(featureMean).square().mean(0).sqrt()
    const normalizedFeatures = featureTensor.sub(featureMean).div(featureStd.add(1e-8))

    // Normalize targets
    const targetMean = targetTensor.mean().dataSync()[0]
    const targetStd = targetTensor.sub(targetMean).square().mean().sqrt().dataSync()[0]
    const normalizedTargets = targetTensor.sub(targetMean).div(targetStd + 1e-8)

    console.log(`Target normalization: mean=${targetMean.toFixed(2)}, std=${targetStd.toFixed(2)}`)

    // Create and train model
    const model = createModel(data.features[0].length)

    console.log("Training neural network...")
    const history = await model.fit(normalizedFeatures, normalizedTargets, {
      epochs: 100,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 20 === 0) {
            console.log(`Epoch ${epoch}: loss = ${logs?.loss?.toFixed(4)}, val_loss = ${logs?.val_loss?.toFixed(4)}`)
          }
        },
      },
    })

    console.log("Model training completed successfully")

    const scaler = {
      featureMean,
      featureStd,
      targetMean,
      targetStd,
    }

    // Save model to storage
    await saveModelToStorage(model, scaler, data)

    const predict = async (features: number[]): Promise<number> => {
      try {
        const featureTensor = tf.tensor2d([features])
        const normalizedInput = featureTensor.sub(scaler.featureMean).div(scaler.featureStd.add(1e-8))
        const prediction = model.predict(normalizedInput) as tf.Tensor
        const denormalizedPrediction = prediction.mul(scaler.targetStd).add(scaler.targetMean)
        const result = denormalizedPrediction.dataSync()[0]

        // Cleanup tensors
        featureTensor.dispose()
        normalizedInput.dispose()
        prediction.dispose()
        denormalizedPrediction.dispose()

        return Math.max(0, result) // Ensure non-negative salary
      } catch (error) {
        console.error("Prediction error:", error)
        throw error
      }
    }

    const predictBatch = async (features: number[][]): Promise<number[]> => {
      try {
        const featureTensor = tf.tensor2d(features)
        const normalizedInput = featureTensor.sub(scaler.featureMean).div(scaler.featureStd.add(1e-8))
        const predictions = model.predict(normalizedInput) as tf.Tensor
        const denormalizedPredictions = predictions.mul(scaler.targetStd).add(scaler.targetMean)
        const results = Array.from(denormalizedPredictions.dataSync()).map((x) => Math.max(0, x))

        // Cleanup tensors
        featureTensor.dispose()
        normalizedInput.dispose()
        predictions.dispose()
        denormalizedPredictions.dispose()

        return results
      } catch (error) {
        console.error("Batch prediction error:", error)
        throw error
      }
    }

    // Cleanup training tensors
    featureTensor.dispose()
    targetTensor.dispose()
    normalizedFeatures.dispose()
    normalizedTargets.dispose()

    return {
      model,
      scaler,
      predict,
      predictBatch,
    }
  } catch (error) {
    console.error("Error in model training:", error)
    throw new Error(`Model training failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function getOrTrainModel(data: ProcessedData): Promise<MLModel> {
  try {
    // Try to load existing model
    const savedModel = await loadModelFromStorage()

    if (savedModel) {
      console.log("Using saved model from storage")

      // Validate that the saved model is compatible with current data
      if (
        savedModel.metadata.features.length === data.featureNames.length &&
        savedModel.metadata.topJobTitles.length === data.topJobTitles.length
      ) {
        const predict = async (features: number[]): Promise<number> => {
          try {
            const featureTensor = tf.tensor2d([features])
            const normalizedInput = featureTensor
              .sub(savedModel.scaler.featureMean)
              .div(savedModel.scaler.featureStd.add(1e-8))
            const prediction = savedModel.model.predict(normalizedInput) as tf.Tensor
            const denormalizedPrediction = prediction.mul(savedModel.scaler.targetStd).add(savedModel.scaler.targetMean)
            const result = denormalizedPrediction.dataSync()[0]

            // Cleanup tensors
            featureTensor.dispose()
            normalizedInput.dispose()
            prediction.dispose()
            denormalizedPrediction.dispose()

            return Math.max(0, result)
          } catch (error) {
            console.error("Prediction error:", error)
            throw error
          }
        }

        const predictBatch = async (features: number[][]): Promise<number[]> => {
          try {
            const featureTensor = tf.tensor2d(features)
            const normalizedInput = featureTensor
              .sub(savedModel.scaler.featureMean)
              .div(savedModel.scaler.featureStd.add(1e-8))
            const predictions = savedModel.model.predict(normalizedInput) as tf.Tensor
            const denormalizedPredictions = predictions
              .mul(savedModel.scaler.targetStd)
              .add(savedModel.scaler.targetMean)
            const results = Array.from(denormalizedPredictions.dataSync()).map((x) => Math.max(0, x))

            // Cleanup tensors
            featureTensor.dispose()
            normalizedInput.dispose()
            predictions.dispose()
            denormalizedPredictions.dispose()

            return results
          } catch (error) {
            console.error("Batch prediction error:", error)
            throw error
          }
        }

        return {
          model: savedModel.model,
          scaler: savedModel.scaler,
          predict,
          predictBatch,
          metadata: savedModel.metadata,
        }
      } else {
        console.log("Saved model is incompatible with current data, retraining...")
      }
    }

    // Train new model if no saved model or incompatible
    return await trainNewModel(data)
  } catch (error) {
    console.error("Error in getOrTrainModel:", error)
    throw error
  }
}

// Legacy function for backward compatibility
export async function trainModel(data: ProcessedData): Promise<MLModel> {
  return getOrTrainModel(data)
}
