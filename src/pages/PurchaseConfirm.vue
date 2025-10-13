<script setup>
import { ref, computed, defineProps, defineEmits, onMounted } from 'vue'
import { useStore } from "@/store"
import { useI18n } from 'vue-i18n'
import { ethers } from "ethers";
import utils, { toast } from "@/utils"
import comm from '@/comm';


const store = useStore();
const { t } = useI18n();
const PAYMENT_ADDRESS   = import.meta.env.VITE_PAYMENT_ADDRESS;
const OBSR_ADDRESS   = import.meta.env.VITE_OBSR_ADDRESS;


const isLoaded = ref(false);
const isPaymentProc = ref(false);
const apiResult = ref(null);
const checkedAgree = ref({'agree3': false});

const props = defineProps({
    datatype: { type: String, required: true },
    cities: { type: Array, required: true, validator: (val) => Array.isArray(val) && val.every(v => typeof v === 'object') },
    daterange: { type: Array, required: true, validator: (val) => Array.isArray(val) && val.every(v => v instanceof Date) },
    datas: { type: Array, required: true, validator: (val) => Array.isArray(val) && val.every(v => typeof v === 'object') },
});

const emit = defineEmits(['close', 'complete']);


const formattedCityName = computed(() => {
    const citiesObj = apiResult.value.cities;
    if ( !citiesObj || typeof citiesObj != 'object' || Object.keys(citiesObj).length == 0 ) return '-';

    const cityKeys = Object.keys(citiesObj);
    const parts = cityKeys[0].split('_');

    const city = props.cities.find(item => item.nation === parts[0] && item.city === parts[1]) || null;
    let cityName = city?.cityName || '';
    if ( cityKeys.length > 1 ) {
        cityName = `${cityName} ${t('purchase.content.nums', cityKeys.length - 1)}`;
    }

    return cityName;
});

const formattedPeriod = computed(() => {
    if ( !apiResult.value || !apiResult.value.start || !apiResult.value.end ) return t('purchase.content.select');

    const s = utils.parseDate(apiResult.value.start); s.setHours(0, 0, 0, 0);
    const e = utils.parseDate(apiResult.value.end); e.setHours(0, 0, 0, 0);
    const diff = Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;

    if ( diff <= 0 ) {
        return `${utils.formatSingleDate(s)} ~ ${utils.formatSingleDate(e)}`;
    }

    return `${utils.formatSingleDate(s)} ~ ${utils.formatSingleDate(e)} (${t('purchase.content.days', diff)})`;
});

const formattedDatas = computed(() => {
    const dataArray = apiResult.value.datas;
    if ( !dataArray || !Array.isArray(dataArray) || dataArray.length == 0 ) return '-';
    
  	let dataName = store.getDataInfo(props.datatype, dataArray[0].code).name;
    if ( dataArray.length > 1 ) {
        dataName = `${dataName} ${t('purchase.content.nums', dataArray.length - 1)}`;
    }
    
    return dataName;
});


function isActiveButton() {
    if ( isLoaded.value == false ) return false;
	if ( apiResult.value == null ) return false;
    if ( apiResult.value.totalAmount <= 0.01 ) return false;

	const allAgreed = Object.values(checkedAgree.value).every(v => v === true);
	if ( !allAgreed ) return false;

	return true;
}

function onClickPayment() {
	if ( !isActiveButton() ) return;
    if ( isPaymentProc.value ) return;

	requestPayment();
}

async function requestPurchase() {
    try {
        const [start, end] = props.daterange;
        const result = await comm.RequestPOST(store.lang, "/purchase", {
            account: store.user.account,
            data_type: props.datatype,
            datas: props.datas,
            cities: props.cities.map(c => `${c.nation}_${c.city}`),
            start: utils.formatSingleDateNum(start),
            end: utils.formatSingleDateNum(end),
        });
        //console.log('requestPurchase:', result);

        apiResult.value = result;
        isLoaded.value = true;
    } catch (err) {
        console.error("requestPurchase error:", err);
    }
}

async function updatePurchase(txid) {
    try {
        const result = await comm.RequestPOST(store.lang, "/purchase/txid", {
            account: store.user.account,
            purchaseID: apiResult.value.purchaseID,
            txid: txid,
        });
        console.log('updatePurchase:', result);

    } catch (err) {
        console.error("updatePurchase error:", err);
    }
}

async function requestPayment() {
    if ( !apiResult.value || !apiResult.value.purchaseID || !apiResult.value.totalAmount ) {
        console.error("Invalid apiResult data");
        return;
    }

    const OBSR_ABI = [
        "function approve(address spender, uint256 amount) public returns (bool)",
        "function allowance(address owner, address spender) public view returns (uint256)",
        "function balanceOf(address account) external view returns (uint256)",
    ];

    const PAYMENT_ABI = [
        "function payment(uint32 id_, uint256 amount_) external",
        "event Payment(address indexed from, uint32 id, uint256 amount, address paymentAccount, uint256 blockNumber)",
    ];

    try {
        if ( !window.ethereum ) {
            toast.error("Metamask is not installed.");
            return;
        }
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        isPaymentProc.value = true;

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();

        if ( network.chainId !== 8217n && network.chainId !== 1001n ) {
            toast.error("Please switch to the Kaia network.");
            return;
        }

        const obsr = new ethers.Contract(OBSR_ADDRESS, OBSR_ABI, signer);
        const paymentContract = new ethers.Contract(PAYMENT_ADDRESS, PAYMENT_ABI, signer);

        const purchaseID = parseInt(apiResult.value.purchaseID);
        const totalAmount = ethers.parseUnits(apiResult.value.totalAmount.toString(), 8);

        const userAddress = await signer.getAddress();
        const balance = await obsr.balanceOf(await signer.getAddress());
        const currentAllowance = await obsr.allowance(userAddress, PAYMENT_ADDRESS);

        if ( balance < totalAmount ) {
            toast.error("Insufficient balance");
            return;
        }

        // approve 실행
        if ( currentAllowance < totalAmount ) {
            const approveTx = await obsr.approve(PAYMENT_ADDRESS, ethers.MaxUint256);
            await approveTx.wait();
        }

        // payment 실행
        const tx = await paymentContract.payment(purchaseID, totalAmount);
        const receipt = await tx.wait();
        console.log("✅ Payment confirmed:", receipt);

        // DB 갱신
        await updatePurchase(receipt.hash);

        // 완료 메세지 출력
        toast.info("Payment has been completed!");
        emit('complete');
    } catch (err) {
        console.error("Payment error:", err);
        toast.error("An error occurred during the payment.");
    }
}

onMounted(() => requestPurchase());
</script>

<template>
    <div class="content">
        <div class="close" @click="emit('close')">X</div>
        <h3>{{ $t('purchase.content.title2') }}</h3>
        <template v-if="isLoaded">
            <ul>
                <li>
                    <strong>{{ $t('purchase.content.type') }}</strong>
                    <span>{{ store.getDatatypeByType(datatype).name }}</span>
                </li>
                <li>
                    <strong>{{ $t('purchase.content.nation') }}</strong>
                    <span>{{ formattedCityName }}</span>
                </li>
                <li>
                    <strong>{{ $t('purchase.content.period') }}</strong>
                    <span>{{ formattedPeriod }}</span>
                </li>
                <li>
                    <strong>{{ $t('purchase.content.datas') }}</strong>
                    <span>{{ formattedDatas }}</span>
                </li>
                <li>
                    <strong>{{ $t('purchase.content.settle') }}</strong>
                    <span><strong>{{ utils.formatNumber(apiResult.totalAmount) }}</strong>OBSR</span>
                </li>
            </ul>
            <div class="agree">
                <div class="item" @click="checkedAgree.agree3 = !checkedAgree.agree3">
                    <img src="@/assets/images/check_good.svg" width="24" height="24" v-if="checkedAgree.agree3" />
                    <img src="@/assets/images/check_none.svg" width="24" height="24" v-else />
                    {{ $t('purchase.content.agree3')}}
                </div>
            </div>
            <button :class="{'metamask': isActiveButton()}" @click="onClickPayment()">
                <img src="@/assets/images/metamask.svg" width="20" height="20" v-if="isActiveButton()" />
                {{ 
                    isActiveButton()
                        ? isPaymentProc ? $t('purchase.content.settlement_process') : $t('purchase.content.settlement')
                        : $t('purchase.content.settlement_input')
                }}
            </button>
        </template>
        <template v-else>
            <div style="display: flex; justify-content: center; align-items: center; height: 200px;">
                <i class="loading"></i>
            </div>
        </template>
    </div>
</template>

<style scoped>
.content { position: relative; width: 400px; padding: 8px; }
.content .close { position: absolute; top: 8px; right: 8px; cursor: pointer; }
.content h3 { margin-bottom: 16px; }
.content ul { list-style: none; }
.content ul li:not(.chips li) { display: flex; justify-content: space-between; border-bottom: 1px solid #DBE4EB; padding: 12px 0; }
.content ul li strong { display: block; font-size: 14px; font-weight: 500; color: #40484E; min-width: 80px; }
.content ul li span { display: block; font-size: 14px; font-weight: 600; color: #40484E; }
.content ul li span strong { display: inline; color: #F46050; padding-right: 6px; }
.content ul li:not(.chips li):last-child { border-bottom: none; }

.content .agree { border: 1px solid #DBE4EB; border-radius: 12px; margin-top: 48px; padding: 4px 12px; }
.content .agree>.item { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; color: #22262A; margin: 8px 0; cursor: pointer; }

.content button { width: 100%; margin-top: 12px }
.content button.metamask { background: #E5EBF0; color: #22262A; }

.content .loading { background-color: #F46050; width: 48px; height: 48px;}

</style>