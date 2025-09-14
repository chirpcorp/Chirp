import React from "react";

const DeleteIcon = ({ size = 20, color = "currentColor", ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M6.5 7.5V15.5M10 7.5V15.5M13.5 7.5V15.5M3.5 5.5H16.5M8.5 3.5H11.5M5.5 5.5V16.5C5.5 17.0523 5.94772 17.5 6.5 17.5H13.5C14.0523 17.5 14.5 17.0523 14.5 16.5V5.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default DeleteIcon;
