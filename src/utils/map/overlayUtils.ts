
export const clearOverlayByCondition = (
  mapOverlays: Array<{overlay: any; type: string; [key: string]: any}>,
  conditionToRemove: (overlayDetail: { overlay: any; type: string; [key: string]: any }) => boolean
): Array<{overlay: any; type: string; [key: string]: any}> => {
  const overlaysToKeep: Array<{ overlay: any; type: string; [key: string]: any }> = [];
  mapOverlays.forEach(overlayDetail => {
    if (conditionToRemove(overlayDetail)) {
      if (overlayDetail.overlay && typeof overlayDetail.overlay.setMap === 'function') {
        overlayDetail.overlay.setMap(null); // Remove from map
      }
    } else {
      overlaysToKeep.push(overlayDetail); // Keep this one
    }
  });
  return overlaysToKeep;
};

