import toast from "react-hot-toast";
import { studentEndpoints } from "../apis";
import { apiConnector } from "../apiconnector";
import rzpLogo from "../../assets/Logo/rzp_logo.png"
import { removeCoursesFromCart } from "../../slices/cartSlice";
import { setPaymentLoading } from "../../slices/courseSlice";

const { CHECKOUT_CONFIG_API, APPLY_COUPON_API, COURSE_PAYMENT_API, COURSE_VERIFY_API, SEND_PAYMENT_SUCCESS_EMAIL_API, PURCHASE_HISTORY_API } = studentEndpoints;

function loadScript(src) {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;

        script.onload = () => {
            resolve(true);
        }

        script.onerror = () => {
            resolve(false);
        }
        document.body.appendChild(script);
    })
};

async function sendPaymentSuccessEmail(response, amount, token) {
    try {
        await apiConnector("POST", SEND_PAYMENT_SUCCESS_EMAIL_API, {
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            amount,
        }, {
            Authorization: `Bearer ${token}`
        });
    } catch (error) {
        console.log(error);
    }
}

async function verifyPayment(bodyData, token, navigate, dispatch) {
    const toastId = toast.loading("Verifying payment...");
    dispatch(setPaymentLoading(true));
    try {
        const response = await apiConnector("POST", COURSE_VERIFY_API, bodyData, {
            Authorization: `Bearer ${token}`
        });

        if (!response.data.success) {
            throw new Error(response.data.message);
        }
        toast.success("Payment successful");
        navigate("/dashboard/enrolled-courses");
        // "Buy now" on one course shouldn't empty the rest of the cart.
        dispatch(removeCoursesFromCart(bodyData.courses ?? []));
    } catch (error) {
        console.log("Payment verify failed", error);
        toast.error("Could not verify payment");
    }
    toast.dismiss(toastId);
    dispatch(setPaymentLoading(false));
}

// The flat platform fee (rupees) added to paid orders. Fetched once per visit; resolves to null
// if it couldn't be loaded (the server still adds it, and the checkout summary shows it from the quote).
let platformFeeRequest = null;
export function getPlatformFee() {
    platformFeeRequest ??= apiConnector("GET", CHECKOUT_CONFIG_API)
        .then((response) => Number(response.data.platformFee) || 0)
        .catch((error) => {
            console.log("CHECKOUT CONFIG API ERROR.....", error);
            platformFeeRequest = null;
            return null;
        });
    return platformFeeRequest;
}

// The server prices the courses with the coupon. Resolves to { quote } ({ subtotal, discount, total, coupon })
// or { error } with the reason the coupon can't be used. Quiet (no toasts): the cart shows the result inline.
export async function applyCoupon(token, courses, coupon) {
    try {
        const response = await apiConnector("POST", APPLY_COUPON_API, { courses, coupon }, {
            Authorization: `Bearer ${token}`
        });
        return { quote: response.data.data };
    } catch (error) {
        console.log("APPLY COUPON API ERROR.....", error);
        return { error: error.response?.data?.message ?? "Could not apply the coupon. Try again" };
    }
}

// `coupon` is an optional code; the server recalculates the amount from it, so the browser never sets the price.
export async function buyCourse(token, courses, userDetails, navigate, dispatch, coupon) {
    const toastId = toast.loading("Loading...");
    try {
        const orderResponse = await apiConnector("POST", COURSE_PAYMENT_API,
            { courses, ...(coupon && { coupon }) }, { Authorization: `Bearer ${token}` });

        if (!orderResponse.data.success) {
            throw new Error(orderResponse.data.message);
        }

        // The coupon covered the whole price: the server has already enrolled the student.
        if (orderResponse.data.free) {
            toast.dismiss(toastId);
            toast.success("You're enrolled");
            navigate("/dashboard/enrolled-courses");
            dispatch(removeCoursesFromCart(courses));
            return;
        }

        const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
        if (!res) {
            throw new Error("Could not load the payment gateway. Check your connection and try again");
        }

        // Sent by the server with the order so Checkout uses the account that created it.
        const key = orderResponse.data.key;
        if (!key) {
            throw new Error("Payments are not configured. Please try again later");
        }

        const options = {
            key,
            currency: orderResponse.data.message.currency,
            amount: `${orderResponse.data.message.amount}`,
            order_id: orderResponse.data.message.id,
            name: "StudyNotion",
            description: "Thank You for Purchasing the Course",
            image: rzpLogo,
            prefill: {
                name: `${userDetails.firstName}`,
                email: userDetails.email
            },
            handler: function (response) {
                sendPaymentSuccessEmail(response, orderResponse.data.message.amount, token);
                verifyPayment({ ...response, courses }, token, navigate, dispatch);
            }
        };
        
        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
        paymentObject.on("payment.failed", function(response) {
            toast.error("oops, payment failed");
            console.log(response.error);
        });

    } catch (error) {
        console.log("PAYMENT API ERROR.....", error);
        toast.error(error.response?.data?.message ?? error.message ?? "Could not make Payment");
    }
    toast.dismiss(toastId);
};

// { payments, summary, page, totalPages } for the purchase history page, or null on failure.
export async function fetchPurchaseHistory(token, params = {}) {
    try {
        const response = await apiConnector("GET", PURCHASE_HISTORY_API, null, { Authorization: `Bearer ${token}` }, params);
        const { data, summary, page, totalPages } = response.data;
        return { payments: data ?? [], summary, page, totalPages };
    } catch (error) {
        console.log("PURCHASE HISTORY API ERROR.....", error);
        toast.error("Could not load your purchases");
        return null;
    }
}
