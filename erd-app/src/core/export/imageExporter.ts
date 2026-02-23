export function exportCanvasAsImage(canvas: HTMLCanvasElement, filename = 'erd-diagram.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}
