/**
 * The plaintext shape stored inside Measurement.encryptedData (AES-256-GCM).
 * All values are in centimetres unless noted.
 */
export interface BodyMeasurements {
  chest: number;
  waist: number;
  hips: number;
  inseam: number;
  shoulder: number;
  sleeveLength: number;
  height: number;
  weight: number; // kg
  notes?: string;
}
