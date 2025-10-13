import { toast as toastify } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

export const toast = {
    success(message) {
        toastify(message, {
            "theme": "light",
            "type": "success",
            "position": "top-center",
            "autoClose": 3000,
            "hideProgressBar": true,
            "dangerouslyHTMLString": true,
            "icon": false,
            "closeButton": false,
            "toastClassName": "toastClassSuccess",
            "bodyClassName": "toastBodyClass"
        });
    },
    error(message) {
        toastify(message, {
            "theme": "light",
            "type": "error",
            "position": "top-center",
            "autoClose": 3000,
            "hideProgressBar": true,
            "dangerouslyHTMLString": true,
            "icon": false,
            "closeButton": false,
            "toastClassName": "toastClassError",
            "bodyClassName": "toastBodyClass"
        });
    },
    info(message) {
        toastify(message, {
            "theme": "light",
            "type": "info",
            "position": "top-center",
            "autoClose": 3000,
            "hideProgressBar": true,
            "dangerouslyHTMLString": true,
            "icon": false,
            "closeButton": false,
            "toastClassName": "toastClassInfo",
            "bodyClassName": "toastBodyClass"
        });
    },
    warning(message) {
        toastify(message, {
            "theme": "light",
            "type": "warning",
            "position": "top-center",
            "autoClose": 3000,
            "hideProgressBar": true,
            "dangerouslyHTMLString": true,
            "icon": false,
            "closeButton": false,
            "toastClassName": "toastClassWarning",
            "bodyClassName": "toastBodyClass"
        });
    },
};

const utils =
{
    formatNumber(value, fractionDigits = 1) {
        if ( value == null || isNaN(value) ) return (0).toFixed(fractionDigits);
        return new Intl.NumberFormat('ko-KR', {
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits,
        }).format(value);
    },
    formatSingleDate: function(date) {
  	    const d = new Date(date);
  	    const y = d.getFullYear();
  	    const m = d.getMonth() + 1;
  	    const day = d.getDate();
  	    return `${y}. ${m}. ${day}`;
    },
    formatSingleDateNum: function(date) {
        const d = new Date(date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return Number(`${y}${m}${day}`);
    },
    formatTxHash: function(hash, startLength = 8, endLength = 6) {
        if (!hash || typeof hash !== "string") return "";
        if (hash.length <= startLength + endLength) return hash;
        return `${hash.substring(0, startLength)} ... ${hash.substring(hash.length - endLength)}`;
    },
    parseDate: function(date) {
        const str = date.toString();
        const year = parseInt(str.substring(0, 4));
        const month = parseInt(str.substring(4, 6)) - 1;
        const day = parseInt(str.substring(6, 8));
        return new Date(year, month, day);
    },
    diffDays: function(start, end) {
        if (!start || !end) return 0;

        const s = this.parseDate(start); s.setHours(0, 0, 0, 0);
        const e = this.parseDate(end); e.setHours(0, 0, 0, 0);

        const diff = Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
        return diff > 0 ? diff : 0;
    },
    isValidEmail: function(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
};

export default utils
