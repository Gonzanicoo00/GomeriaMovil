import React from 'react';
import Svg, { Circle, Defs, Mask, Polygon, Rect } from 'react-native-svg';

interface Props {
  size: number;
  color: string;
}

// Misma geometria que los iconos de assets/ (viewBox 0..100): cubierta con surcos y llanta con 5 ventanas.
const SURCOS = Array.from({ length: 20 }, (_, i) => {
  const a = (i * 18 * Math.PI) / 180;
  const b = a + (9 * Math.PI) / 180;
  const w = 1.3;
  const xy = (r: number, ang: number, off: number) =>
    `${50 + r * Math.cos(ang) - off * Math.sin(ang)},${50 + r * Math.sin(ang) + off * Math.cos(ang)}`;
  return [xy(36.5, a, -w), xy(44, b, -w), xy(44, b, w), xy(36.5, a, w)].join(' ');
});

const VENTANAS = Array.from({ length: 5 }, (_, i) => {
  const a = ((-90 + i * 72) * Math.PI) / 180;
  return { cx: 50 + 17 * Math.cos(a), cy: 50 + 17 * Math.sin(a) };
});

/** Marca de Gomería Móvil. Los huecos son transparentes, asi que sirve sobre cualquier fondo. */
export function LogoMark({ size, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <Mask id="huecos">
          <Rect x="0" y="0" width="100" height="100" fill="#fff" />
          {SURCOS.map((puntos, i) => (
            <Polygon key={i} points={puntos} fill="#000" />
          ))}
          <Circle cx="50" cy="50" r="33" fill="#000" />
          <Circle cx="50" cy="50" r="29" fill="#fff" />
          {VENTANAS.map((v, i) => (
            <Circle key={i} cx={v.cx} cy={v.cy} r="5.8" fill="#000" />
          ))}
          <Circle cx="50" cy="50" r="4.5" fill="#000" />
        </Mask>
      </Defs>
      <Circle cx="50" cy="50" r="46" fill={color} mask="url(#huecos)" />
    </Svg>
  );
}
