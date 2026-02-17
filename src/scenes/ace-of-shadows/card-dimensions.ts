export const CARD_WIDTH = 200;
export const CARD_HEIGHT: number = Math.round((CARD_WIDTH * 16) / 9);

const CORNER_RADIUS = 19;
const BORDER_INSET = 6;
const PADDING: number = BORDER_INSET + 13;
const CIRCLE_R = 17;

export const cardDimensions: {
  width: number;
  height: number;
  cornerRadius: number;
  borderInset: number;
  padding: number;
  circleRadius: number;
} = {
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  cornerRadius: CORNER_RADIUS,
  borderInset: BORDER_INSET,
  padding: PADDING,
  circleRadius: CIRCLE_R,
};
