export const showOverlay = (): void => {
  const overlayElement = document.getElementById("overlay") as HTMLElement | null;
  if (overlayElement) {
    overlayElement.style.display = "flex";
    overlayElement.style.zIndex = "9999"; // Ensure it's above other elements
  }
};

export const hideOverlay = (): void => {
  const overlayElement = document.getElementById("overlay") as HTMLElement | null;
  if (overlayElement) {
    overlayElement.style.display = "none";
  }
};
