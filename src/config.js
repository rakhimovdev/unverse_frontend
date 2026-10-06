export const API_URL = process.env.REACT_APP_API_URL || "/api";

export const getBackendAssetURL = (value) => {
    const backendRoot = API_URL.replace(/\/api\/?$/i, "").replace(/\/+$/, "");
    const assetPath = value.replace(/^\/+/, "").startsWith("uploads/")
        ? value.replace(/^\/+/, "")
        : `uploads/${value.replace(/^\/+/, "")}`;

    return `${backendRoot}/${assetPath}`;
};