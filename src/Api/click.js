import Api from "./Axios";

export const createClickPayment = async (planType) => {
    const res = await Api.post("/api/click/create", { planType });
    return res.data;
};
