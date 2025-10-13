<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from "@/store"
import { useI18n } from 'vue-i18n'
import utils from "@/utils"
import vSelect from "vue3-select"
import Datepicker from '@vuepic/vue-datepicker'
import "vue3-select/dist/vue3-select.css"
import '@vuepic/vue-datepicker/dist/main.css'
import PurchaseConfirm from './PurchaseConfirm.vue'
import AlertDialog from '@/components/AlertDialog.vue'

const router = useRouter();
const store = useStore();
const { t } = useI18n();


const selectedDatatype = ref('');
const selectedNation = ref(store.nation[0]);
const selectedCities = ref([]); 
const selecteDateRange = ref();
const selectDataList = ref([]);
const checkedAgree = ref({'agree1': false, 'agree2': false});
const showDialog = ref(false);


const groupDataList = computed(() => {
  	const raw = store.getDatatypeByType(selectedDatatype.value);
	if ( !raw ) return [];
	
  	return Object.values(
    	raw.datas.reduce((acc, item) => {
      		if ( !acc[item.category] ) acc[item.category] = { category: item.category, list: [] };
      		acc[item.category].list.push({code: item.code, name: item.name, amount: item.amount});
      		return acc;
    	}, {})
  	);
});

const formattedPeriod = computed(() => {
  	if ( !selecteDateRange.value || !Array.isArray(selecteDateRange.value) ) return t('purchase.content.select');

  	const [start, end] = selecteDateRange.value;
  	if ( !start || !end ) return t('purchase.content.select');

	const s = new Date(start);
  	const e = new Date(end);
  	s.setHours(0, 0, 0, 0);
  	e.setHours(0, 0, 0, 0);

	const diff = (e - s) / (1000 * 60 * 60 * 24) + 1;
	if ( diff == 0 ) {
  		return `${utils.formatSingleDate(start)} ~ ${utils.formatSingleDate(end)}`;
	}

	return `${utils.formatSingleDate(start)} ~ ${utils.formatSingleDate(end)}  (${t('purchase.content.days', diff)})`;
});

const dayCount = computed(() => {
  	if ( !selecteDateRange.value || !Array.isArray(selecteDateRange.value) ) return 0;

  	const [start, end] = selecteDateRange.value;
  	if ( !start || !end ) return 0;

  	const s = new Date(start);
  	const e = new Date(end);
  	s.setHours(0, 0, 0, 0);
  	e.setHours(0, 0, 0, 0);

  	const diff = (e - s) / (1000 * 60 * 60 * 24) + 1;
  	return diff;
});

const purchaseDataList = computed(() => {
	const type = store.getDatatypeByType(selectedDatatype.value);
	if ( !type || !Array.isArray(type.datas) ) return [];

  	return selectDataList.value.map(code => {
    	const info = store.getDataInfo(selectedDatatype.value, code);
    	return {code, name: info?.name, amount: info?.amount * type?.cntperday * dayCount.value * selectedCities.value.length};
  	});
});

const purchaseTotalAmount = computed(() => {
  	return purchaseDataList.value.reduce((sum, row) => sum + (row.amount || 0), 0);
});


function formatDate(date) {
  	if ( !date ) return "";
  	if ( Array.isArray(date) ) {
    	const [start, end] = date;
    	if ( !start || !end ) return "";
    	return `${utils.formatSingleDate(start)} ~ ${utils.formatSingleDate(end)}`;
  	}
  	return utils.formatSingleDate(date);
}

async function onChangeDatatype(value) {
  	selectedDatatype.value = value;
	selectDataList.value = [];
}

function toggleCity(city) {
  	const entry = {
    	nation: selectedNation.value.code,
    	nationName: selectedNation.value.name,
    	city: city.code,
    	cityName: city.name,
  	};

  	const exists = selectedCities.value.find(
    	c => c.nation === entry.nation && c.city === entry.city
  	);

  	if ( exists ) {
    	selectedCities.value = selectedCities.value.filter(
      		c => !(c.nation === entry.nation && c.city === entry.city)
    	);
  	} else {
    	selectedCities.value.push(entry);
  	}
}

function removeCity(item) {
  	selectedCities.value = selectedCities.value.filter(
    	c => !(c.nation === item.nation && c.city === item.city)
  	);
}

function onDateChange(value) {
  	if ( !Array.isArray(value) ) return;

  	const today = new Date();
  	today.setHours(0, 0, 0, 0);
  	const [start, end] = value;
  	const fixed = [];

  	if ( start ) { fixed[0] = new Date(start > today ? today : start); }
  	if ( end ) { fixed[1] = new Date(end > today ? today : end); }

  	selecteDateRange.value = fixed;
}

function toggleDataList(code) {
	if ( selectDataList.value.includes(code) ) {
    	selectDataList.value = selectDataList.value.filter(c => c !== code);
  	} else {
    	selectDataList.value.push(code);
  	}
}

function isActiveButton() {
	if ( selectedDatatype.value.length == 0 ) return false;
	if ( selectedCities.value.length == 0 ) return false;
	if ( dayCount.value == 0 ) return false;
	if ( purchaseTotalAmount.value == 0 ) return false;

	const allAgreed = Object.values(checkedAgree.value).every(v => v === true);
	if ( !allAgreed ) return false;

	return true;
}

function onClickPurchase() {
	if ( !isActiveButton() ) return;

	showDialog.value = true;
}

function onPurchaseComplete() {
	showDialog.value = false;
	setTimeout(() => { router.push('/store/history'); }, 3000);
}

</script>

<template>
    <div class="wpurchase">
		<div class="title">{{ $t('purchase.title') }}</div>
		<div class="body">
			<div class="left">
				<li>
					<h3>{{ $t('purchase.datatype.title') }}</h3>
					<p>{{ $t('purchase.datatype.desc') }}</p>
					<v-select label="name"
						:options="store.datatype"
  						:reduce="option => option.type"
						:searchable="false"
						:clearable="false"
						:placeholder="$t('purchase.placeholder')"
						@update:modelValue="onChangeDatatype"
						style="margin-top: 16px; margin-bottom: 8px;"
					>
						<template #header>
							<div class="header">{{ $t('purchase.datatype.title') }}</div>
						</template>
					</v-select>
				</li>
				<li>
					<h3>{{ $t('purchase.nation.title') }}</h3>
					<p style="margin-bottom: 16px;">{{ $t('purchase.nation.desc') }}</p>
					<div class="nation-wrapper">
    					<div class="nations">
							<div class="title">{{ $t('purchase.nation.nation') }}</div>
							<div class="item-wrapper">
								<div v-for="nation in store.nation" :key="nation.code" class="item" :class="{ active: selectedNation.code === nation.code }" @click="selectedNation = nation">
									{{ nation.name }}
								</div>
							</div>
    					</div>
    					<div class="cities">
							<div class="title">{{ $t('purchase.nation.city') }}</div>
							<div class="item-wrapper">
								<div v-for="city in selectedNation.cities" :key="city.code" class="item" @click="toggleCity(city)">
									<img src="@/assets/images/check_good.svg" width="20" height="20" v-if="selectedCities.some(c => c.nation === selectedNation.code && c.city === city.code)" />
									<img src="@/assets/images/check_none.svg" width="20" height="20" v-else />
									{{ city.name }}
								</div>
							</div>
    					</div>
  					</div>
				</li>
				<li>
					<h3>{{ $t('purchase.period.title') }}</h3>
					<p>{{ $t('purchase.period.desc') }}</p>
					<Datepicker range auto-apply
						v-model="selecteDateRange"
  						:week-start="0"
						:enable-time-picker="false"
						:hide-input-icon="true"
						:placeholder="$t('purchase.period.placeholder')"
						:format="formatDate"
						style="margin:16px 0;"
						@update:model-value="onDateChange"
					/>
				</li>
				<li>
					<h3>{{ $t('purchase.data.title') }}</h3>
					<p>{{ $t('purchase.data.desc') }}</p>
					<div class="data"  v-for="(item, index) in groupDataList" :key="index">
						<div class="category">{{ item.category }}</div>
						<div class="item" :class="{hover: selectDataList.includes(data.code)}" @click="toggleDataList(data.code)" v-for="(data, index2) in item.list" :key="index2">
							<div class="name">
								<img src="@/assets/images/check_good.svg" width="24" height="24" v-if="selectDataList.includes(data.code)" />
								<img src="@/assets/images/check_none.svg" width="24" height="24" v-else />
								{{ data.name }}
							</div>
							<div class="amount">{{ data.amount }} OBSR</div>
						</div>
					</div>
				</li>
			</div>
			<div class="content-wrapper">
				<div class="content">
					<h3>{{ $t('purchase.content.title') }}</h3>
					<ul>
						<li>
							<strong>{{ $t('purchase.content.type') }}</strong>
							<span>{{ store.getDatatypeByType(selectedDatatype)?.name || $t('purchase.content.select') }}</span>
						</li>
						<li>
							<strong>{{ $t('purchase.content.nation') }}</strong>
							<ul class="chips" v-if="selectedCities.length > 0">
								<li v-for="(item, index) in selectedCities" :key="index" @click="removeCity(item)" style="cursor: pointer;">
									{{ item.cityName }}
								</li>
							</ul>
							<span v-if="selectedCities.length == 0">{{ $t('purchase.content.select') }}</span>
						</li>
						<li>
							<strong>{{ $t('purchase.content.period') }}</strong>
							<span>{{ formattedPeriod }}</span>
						</li>
					</ul>
					<div class="table">
						<table>
							<thead>
								<tr>
									<th>{{ $t('purchase.content.datas') }}</th>
									<th>{{ $t('purchase.content.amount') }}</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="(row, index) in purchaseDataList" :key="index">
									<td style="display: flex; align-items: center; gap: 6px;">
										<img src="@/assets/images/check_good.svg" width="24" height="24" />
										{{ row.name }}
									</td>
									<td>{{ utils.formatNumber(row.amount) }} OBSR</td>
								</tr>
								<tr v-if="purchaseDataList.length == 0">
									<td colspan="2" class="nodata">
										<img src="@/assets/images/empty_data.svg" width="20" height="20" />
										{{ $t('purchase.content.dataselect')}}
									</td>
								</tr>
							</tbody>
							<tfoot v-if="purchaseDataList.length > 0">
								<tr>
									<td>{{ $t('purchase.content.sum') }}</td>
									<td>{{ utils.formatNumber(purchaseTotalAmount) }} OBSR</td>
								</tr>
							</tfoot>
						</table>
					</div>
					<div class="agree">
						<div class="item" @click="checkedAgree.agree1 = !checkedAgree.agree1">
							<img src="@/assets/images/check_good.svg" width="24" height="24" v-if="checkedAgree.agree1" />
							<img src="@/assets/images/check_none.svg" width="24" height="24" v-else />
							{{ $t('purchase.content.agree1')}}
						</div>
						<div class="item" @click="checkedAgree.agree2 = !checkedAgree.agree2">
							<img src="@/assets/images/check_good.svg" width="24" height="24" v-if="checkedAgree.agree2" />
							<img src="@/assets/images/check_none.svg" width="24" height="24" v-else />
							{{ $t('purchase.content.agree2')}}
						</div>
					</div>
					<button :class="{'hover': isActiveButton()}" @click="onClickPurchase()">
						{{ isActiveButton() ? $t('purchase.content.purchase') : $t('purchase.content.purchase_input') }}
					</button>
				</div>
			</div>
		</div>

		<AlertDialog :closeOnBackdrop="false" :visible="showDialog" @close="showDialog = false">
			<PurchaseConfirm
				:datatype="selectedDatatype"
				:cities="selectedCities"
				:daterange="selecteDateRange"
				:datas="selectDataList"
				@close="showDialog = false"
				@complete="onPurchaseComplete"
			/>
		</AlertDialog>
    </div>
</template>

<style scoped>
.wpurchase { position: relative; height: 100%; display: flex; flex-direction: column; }
.wpurchase .title { padding: 15px; border-bottom: 0.5px solid #DBE4EB; font-size: 20px; font-weight: 700; background: #FFF; }
.wpurchase .body { flex: 1; display: flex; min-height: 0; }

.wpurchase .body .left { position: relative; width: 380px; border-right: 0.5px solid #DBE4EB; background: #FFF; overflow-y: auto; min-height: 0; }
.wpurchase .body .left li { list-style: none; border-bottom: 0.5px solid #DBE4EB; padding: 16px; padding-top: 32px; }
.wpurchase .body .left li:last-child { border-bottom: none; }
.wpurchase .body .left li button.add { width: 100%; background: #E5EBF0; font-size: 14px; font-weight: 600; color: #22262A; line-height: 14px; }

.wpurchase .body .left .nation-wrapper { display: flex; border: 1px solid #E5EBF0; border-radius: 8px; }
.wpurchase .body .left .nation-wrapper .nations { flex: 1; border-right: 1px solid #E5EBF0; width: 50%; }
.wpurchase .body .left .nation-wrapper .cities { flex: 1; background: #F5F7FA; width: 50%; }
.wpurchase .body .left .nation-wrapper .title { background: #E5EBF0; padding: 8px 12px; font-size: 12px; font-weight: 600; color: #22262A; }
.wpurchase .body .left .nation-wrapper .item-wrapper { max-height: 190px; min-height: 190px; overflow-x: hidden; overflow-y: auto; }
.wpurchase .body .left .nation-wrapper .item-wrapper::-webkit-scrollbar { width: 3px; }
.wpurchase .body .left .nation-wrapper .item-wrapper::-webkit-scrollbar-track { background: transparent; }
.wpurchase .body .left .nation-wrapper .item-wrapper::-webkit-scrollbar-thumb { background-color: #A0ADB7; border-radius: 2px; }
.wpurchase .body .left .nation-wrapper .item { display: flex; align-items: center; gap: 4px; padding: 8px 12px; font-size: 14px; font-weight: 500; color: #22262A; cursor: pointer; }
.wpurchase .body .left .nation-wrapper .item.active { background: #F5F7FA; }

.wpurchase .body .left .data { margin: 20px 0; }
.wpurchase .body .left .data .category { font-size: 14px; font-weight: 600; color: #40484E; margin-bottom: 8px; padding-left: 8px; }
.wpurchase .body .left .data .item { display: flex; justify-content: space-between; align-items: center; gap: 8px; border: 1px solid #DBE4EB; border-radius: 12px; padding: 12px 16px; margin: 4px 0; cursor: pointer; }
.wpurchase .body .left .data .item.hover { background: #F5F7FA; }
.wpurchase .body .left .data .item .name { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; color: #22262A; word-break: break-word; }
.wpurchase .body .left .data .item .amount { font-size: 12px; font-weight: 500; color: #6A7982; white-space: nowrap; flex-shrink: 0; text-align: right; }

.wpurchase .body .content-wrapper { flex: 1; min-height: 0; overflow-y: auto; }
.wpurchase .body .content { position: relative; margin: 24px auto; width: 100%; max-width: 600px; padding: 24px 16px; background: #FFF; border-radius: 8px; align-self: flex-start; }
.wpurchase .body .content h3 { margin-bottom: 16px; }
.wpurchase .body .content ul { list-style: none; }
.wpurchase .body .content ul li:not(.chips li) { display: flex; justify-content: space-between; border-bottom: 1px solid #DBE4EB; padding: 12px 0; }
.wpurchase .body .content ul li strong { display: block; font-size: 14px; font-weight: 500; color: #40484E; min-width: 80px; }
.wpurchase .body .content ul li span { display: block; font-size: 14px; font-weight: 500; color: #40484E; }
.wpurchase .body .content ul li:not(.chips li):last-child { border-bottom: none; }

.wpurchase .body .content .table { margin-top: 24px; border: 1px solid #DBE4EB; border-radius: 8px; overflow: hidden; }
.wpurchase .body .content .table table { width: 100%; border-collapse: collapse; font-size: 14px; font-weight: 500; }
.wpurchase .body .content .table thead { background: #F5F7FA; border-bottom: 1px solid #DBE4EB; }
.wpurchase .body .content .table thead th { padding: 12px 16px; color: #40484E; text-align: left; }
.wpurchase .body .content .table thead th:last-child { text-align: right; }
.wpurchase .body .content .table tbody tr { border-bottom: 1px solid #DBE4EB; }
.wpurchase .body .content .table tbody td { padding: 12px 16px; color: #40484E; }
.wpurchase .body .content .table tbody td:last-child { color: #22262A; text-align: right; }
.wpurchase .body .content .table tfoot tr { background: #40484E; }
.wpurchase .body .content .table tfoot td { padding: 12px 16px; color: #FFF; font-size: 16px; font-weight: 600; }
.wpurchase .body .content .table tfoot td:last-child { text-align: right; }
.wpurchase .body .content .table .nodata { padding: 36px; color: #A0ADB7 !important; text-align: center !important;  }
.wpurchase .body .content .table .nodata img { vertical-align: text-bottom; padding-right: 4px; }

.wpurchase .body .content .agree { border: 1px solid #DBE4EB; border-radius: 12px; margin-top: 60px; padding: 4px 12px; }
.wpurchase .body .content .agree>.item { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; color: #22262A; margin: 8px 0; cursor: pointer; }

.wpurchase .body .content button { width: 100%; margin-top: 12px }

</style>
