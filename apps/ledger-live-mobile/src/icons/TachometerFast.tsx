import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number;
  color: string;
};

export default function TachometerFast({
  size = 16,
  color = "#C3C3C3",
}: Props) {
  return (
    <Svg viewBox="0 0 16 14" width={(size / 14) * 16} height={size} fill="none">
      <Path
        fill={color}
        d="M2.00577 13.3H13.9938C15.0738 11.986 15.7398 10.276 15.7398 8.43995C15.7398 7.01795 15.3618 5.68595 14.6958 4.55195L13.6338 5.61395C14.0658 6.45995 14.2998 7.43195 14.2998 8.43995C14.2998 9.69995 13.9218 10.87 13.2738 11.86H2.72577C2.07777 10.87 1.69977 9.69995 1.69977 8.43995C1.69977 4.96595 4.52577 2.13995 7.99977 2.13995C9.00776 2.13995 9.97976 2.37395 10.8258 2.80595L11.8878 1.74395C10.7538 1.07795 9.42177 0.699951 7.99977 0.699951C3.73377 0.699951 0.259766 4.17395 0.259766 8.43995C0.259766 10.276 0.925766 11.986 2.00577 13.3ZM7.27977 8.43995C7.27977 8.83595 7.60377 9.15995 7.99977 9.15995C8.19777 9.15995 8.37777 9.08795 8.50377 8.94395L13.9938 3.45395L12.9858 2.44595L7.49577 7.93595C7.35177 8.06195 7.27977 8.24195 7.27977 8.43995Z"
      />
    </Svg>
  );
}