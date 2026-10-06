import Api from "./Axios";

export const createClickPayment = async (planType) => {
    const res = await Api.post("/click/create", { planType });
    return res.data;
};
