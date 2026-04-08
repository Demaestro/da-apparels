import type { MeasurementScaleProfile, PoseKeypointLike, ArOverlayFrame, ArTemplate } from "./types";

export interface AnchorPoint {
  x: number;
  y: number;
  score: number;
}

export interface GarmentAnchorMap {
  headCenter: AnchorPoint;
  neckBase: AnchorPoint;
  leftShoulder: AnchorPoint;
  rightShoulder: AnchorPoint;
  leftUpperArm: AnchorPoint;
  rightUpperArm: AnchorPoint;
  leftElbow: AnchorPoint;
  rightElbow: AnchorPoint;
  leftForearm: AnchorPoint;
  rightForearm: AnchorPoint;
  leftWrist: AnchorPoint;
  rightWrist: AnchorPoint;
  leftPalm: AnchorPoint;
  rightPalm: AnchorPoint;
  leftWaist: AnchorPoint;
  rightWaist: AnchorPoint;
  waistCenter: AnchorPoint;
  leftHip: AnchorPoint;
  rightHip: AnchorPoint;
  pelvisCenter: AnchorPoint;
  leftThigh: AnchorPoint;
  rightThigh: AnchorPoint;
  leftKnee: AnchorPoint;
  rightKnee: AnchorPoint;
  leftCalf: AnchorPoint;
  rightCalf: AnchorPoint;
  leftAnkle: AnchorPoint;
  rightAnkle: AnchorPoint;
  leftHeel: AnchorPoint;
  rightHeel: AnchorPoint;
  leftToe: AnchorPoint;
  rightToe: AnchorPoint;
}

function midpoint(a: AnchorPoint, b: AnchorPoint): AnchorPoint {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    score: Math.min(a.score, b.score),
  };
}

function interpolate(a: AnchorPoint, b: AnchorPoint, weight: number): AnchorPoint {
  return {
    x: a.x + (b.x - a.x) * weight,
    y: a.y + (b.y - a.y) * weight,
    score: Math.min(a.score, b.score),
  };
}

function average(points: AnchorPoint[]): AnchorPoint {
  const total = points.reduce(
    (sum, point) => ({
      x: sum.x + point.x,
      y: sum.y + point.y,
      score: sum.score + point.score,
    }),
    { x: 0, y: 0, score: 0 },
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length,
    score: total.score / points.length,
  };
}

function distance(a: AnchorPoint, b: AnchorPoint) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function fallbackPoint(points: Record<string, AnchorPoint>, name: string, fallback: AnchorPoint) {
  return points[name] ?? fallback;
}

export function extractGarmentAnchors(keypoints: PoseKeypointLike[]) {
  const named = keypoints.reduce<Record<string, AnchorPoint>>((result, keypoint) => {
    if (!keypoint.name) {
      return result;
    }

    result[keypoint.name] = {
      x: keypoint.x,
      y: keypoint.y,
      score: keypoint.score ?? 0.6,
    };
    return result;
  }, {});

  const leftShoulder = named.left_shoulder;
  const rightShoulder = named.right_shoulder;
  const leftHip = named.left_hip;
  const rightHip = named.right_hip;
  const leftElbow = named.left_elbow;
  const rightElbow = named.right_elbow;
  const leftWrist = named.left_wrist;
  const rightWrist = named.right_wrist;
  const leftKnee = named.left_knee;
  const rightKnee = named.right_knee;
  const leftAnkle = named.left_ankle;
  const rightAnkle = named.right_ankle;

  if (
    !leftShoulder ||
    !rightShoulder ||
    !leftHip ||
    !rightHip ||
    !leftElbow ||
    !rightElbow ||
    !leftWrist ||
    !rightWrist ||
    !leftKnee ||
    !rightKnee ||
    !leftAnkle ||
    !rightAnkle
  ) {
    return null;
  }

  const fallbackHead = average([
    fallbackPoint(named, "nose", midpoint(leftShoulder, rightShoulder)),
    fallbackPoint(named, "left_ear", leftShoulder),
    fallbackPoint(named, "right_ear", rightShoulder),
  ]);

  const leftPalm = average([
    leftWrist,
    fallbackPoint(named, "left_index", leftWrist),
    fallbackPoint(named, "left_pinky", leftWrist),
    fallbackPoint(named, "left_thumb", leftWrist),
  ]);

  const rightPalm = average([
    rightWrist,
    fallbackPoint(named, "right_index", rightWrist),
    fallbackPoint(named, "right_pinky", rightWrist),
    fallbackPoint(named, "right_thumb", rightWrist),
  ]);

  const leftHeel = fallbackPoint(named, "left_heel", leftAnkle);
  const rightHeel = fallbackPoint(named, "right_heel", rightAnkle);
  const leftToe = fallbackPoint(named, "left_foot_index", leftAnkle);
  const rightToe = fallbackPoint(named, "right_foot_index", rightAnkle);
  const neckBase = midpoint(leftShoulder, rightShoulder);
  const pelvisCenter = midpoint(leftHip, rightHip);
  const leftWaist = interpolate(leftShoulder, leftHip, 0.72);
  const rightWaist = interpolate(rightShoulder, rightHip, 0.72);
  const waistCenter = midpoint(leftWaist, rightWaist);

  return {
    headCenter: fallbackHead,
    neckBase,
    leftShoulder,
    rightShoulder,
    leftUpperArm: midpoint(leftShoulder, leftElbow),
    rightUpperArm: midpoint(rightShoulder, rightElbow),
    leftElbow,
    rightElbow,
    leftForearm: midpoint(leftElbow, leftWrist),
    rightForearm: midpoint(rightElbow, rightWrist),
    leftWrist,
    rightWrist,
    leftPalm,
    rightPalm,
    leftWaist,
    rightWaist,
    waistCenter,
    leftHip,
    rightHip,
    pelvisCenter,
    leftThigh: midpoint(leftHip, leftKnee),
    rightThigh: midpoint(rightHip, rightKnee),
    leftKnee,
    rightKnee,
    leftCalf: midpoint(leftKnee, leftAnkle),
    rightCalf: midpoint(rightKnee, rightAnkle),
    leftAnkle,
    rightAnkle,
    leftHeel,
    rightHeel,
    leftToe,
    rightToe,
  } satisfies GarmentAnchorMap;
}

export function createOverlayFrame(
  anchors: GarmentAnchorMap,
  sourceWidth: number,
  sourceHeight: number,
  measurements: MeasurementScaleProfile,
  template: ArTemplate,
): ArOverlayFrame {
  const shoulderSpan = distance(anchors.leftShoulder, anchors.rightShoulder);
  const hipSpan = distance(anchors.leftHip, anchors.rightHip);
  const torsoHeight = distance(anchors.neckBase, anchors.pelvisCenter);
  const chestCenter = average([anchors.neckBase, anchors.leftWaist, anchors.rightWaist]);
  const hemCenter = average([anchors.leftAnkle, anchors.rightAnkle, anchors.leftToe, anchors.rightToe]);
  const fullLength = distance(anchors.neckBase, hemCenter);

  const templateLengthFactor =
    template === "mini"
      ? 0.7
      : template === "suit"
        ? 0.92
        : template === "structured"
          ? 0.9
          : template === "mermaid"
            ? 1.1
            : 1;

  const widthPx =
    Math.max(
      shoulderSpan * (1.22 * measurements.shoulderScale + 0.12 * measurements.chestScale),
      hipSpan * (1.1 * measurements.hipScale + 0.12 * measurements.waistScale),
    ) * measurements.overallScale;

  const heightPx = Math.max(
    torsoHeight * (2.05 * measurements.heightScale * measurements.drape),
    fullLength * templateLengthFactor,
  );

  const center = interpolate(
    chestCenter,
    hemCenter,
    template === "mini" ? 0.36 : template === "suit" ? 0.43 : 0.48,
  );

  const shoulderAngle = Math.atan2(
    anchors.rightShoulder.y - anchors.leftShoulder.y,
    anchors.rightShoulder.x - anchors.leftShoulder.x,
  );
  const hipAngle = Math.atan2(
    anchors.rightHip.y - anchors.leftHip.y,
    anchors.rightHip.x - anchors.leftHip.x,
  );

  return {
    x: clamp(center.x / sourceWidth, 0.12, 0.88),
    y: clamp(center.y / sourceHeight, 0.12, 0.9),
    width: clamp(widthPx / sourceWidth, 0.18, 0.72),
    height: clamp(heightPx / sourceHeight, 0.28, 0.94),
    rotationDeg: ((shoulderAngle * 0.7 + hipAngle * 0.3) * 180) / Math.PI,
    confidence: clamp(
      average([
        anchors.leftShoulder,
        anchors.rightShoulder,
        anchors.leftHip,
        anchors.rightHip,
        anchors.leftKnee,
        anchors.rightKnee,
      ]).score,
      0,
      1,
    ),
  };
}
