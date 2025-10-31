export const renderPredictions = (predictions, ctx) => {
  // Clear previous frame
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Font settings
  const font = "16px sans-serif";
  ctx.font = font;
  ctx.textBaseline = "top";

  // Icons for objects
  const icons = {
    person: "👤",
    dog: "🐶",
    cat: "🐱",
    car: "🚗",
    // add more if needed
  };

  predictions.forEach((prediction) => {
    const [x, y, width, height] = prediction.bbox;
    const isPerson = prediction.class === "person";

    // Draw bounding box
    ctx.strokeStyle = isPerson ? "#FF0000" : "#00FFFF";
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, width, height);

    // Fill lightly inside box
    ctx.fillStyle = `rgba(255, 0, 0, ${isPerson ? 0.2 : 0})`;
    ctx.fillRect(x, y, width, height);

    // Create label with icon and confidence
    const icon = icons[prediction.class] || "";
    const label = `${icon} ${prediction.class} ${(prediction.score * 100).toFixed(1)}%`;

    const textWidth = ctx.measureText(label).width;
    const textHeight = 16; // same as font size

    // Draw label background
    ctx.fillStyle = isPerson ? "#FF0000" : "#00FFFF";
    ctx.fillRect(x, y, textWidth + 6, textHeight + 6);

    // Draw text
    ctx.fillStyle = "#000000";
    ctx.fillText(label, x + 3, y + 3);

    // Optional: confidence bar below box
    const barWidth = width * prediction.score; // proportional to confidence
    const barHeight = 4;
    ctx.fillStyle = isPerson ? "#FF5555" : "#55FFFF";
    ctx.fillRect(x, y + height + 2, barWidth, barHeight);
  });
};