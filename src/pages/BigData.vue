<script setup>
import { ref } from 'vue'
import { useStore } from "@/store"
import { useI18n } from 'vue-i18n'
import comm from '@/comm'
import utils, { toast }  from "@/utils"

const store = useStore();
const { t } = useI18n();

const input_title = ref('');
const input_body = ref(t('bigdata.content.input.body_placeholder'));
const input_email = ref('');


function isActiveButton() {
    if ( input_title.value.length <= 5 ) return false;
    if ( input_body.value.length <= 30 ) return false;
    if ( !utils.isValidEmail(input_email.value) ) return false;

    return true;
}

let isRequesting = false;
async function onClickRequest() {
    if ( isRequesting ) return;
    if ( !isActiveButton() ) return;

    try {
        isRequesting = true;
        const result = await comm.RequestPOST(store.lang, "/request", {
            type: 'BIG',
            title: input_title.value,
            body: input_body.value,
            email: input_email.value,
        });
        
        input_title.value = '';
        input_body.value = t('bigdata.content.input.body_placeholder');
        input_email.value = '';

        toast.info(t('bigdata.content.input.complete'));

    } catch (err) {
        console.error("onClickRequest error:", err);
        toast.error(err.error.message);
    } finally {
        isRequesting = false;
    }
}
</script>

<template>
    <div class="wbigdata">
        <div class="title">{{ $t('bigdata.title') }}</div>
		<div class="body">
			<div class="content">
                <h3>{{ $t('bigdata.content.title') }}</h3>
				<ul>
                    <li>
						<label>{{ $t('bigdata.content.input.title') }}</label>
						<input v-model="input_title" type="text" :placeholder="$t('bigdata.content.input.title_placeholder')">
					</li>
					<li>
						<label>{{ $t('bigdata.content.input.body') }}</label>
                        <textarea v-model="input_body"></textarea>
					</li>
                    <li>
						<label>{{ $t('bigdata.content.input.email') }}</label>
						<input v-model="input_email" type="text" :placeholder="$t('bigdata.content.input.email_placeholder')">
					</li>
				</ul>
                <button :class="{hover: isActiveButton()}" @click="onClickRequest()">{{ $t('bigdata.content.input.request') }}</button>
            </div>
		</div>
    </div>
</template>

<style scoped>
.wbigdata { position: relative; height: 100%; display: flex; flex-direction: column; }
.wbigdata .title { padding: 15px; border-bottom: 0.5px solid #DBE4EB; font-size: 20px; font-weight: 700; background: #FFF; }
.wbigdata .body { flex: 1; display: flex; min-height: 0; overflow-y: auto; }

.wbigdata .body .content { position: relative; margin: 24px auto; padding: 24px 16px; background: #FFF; border-radius: 8px; width: 100%; max-width: 950px; align-self: flex-start; }
.wbigdata .body .content h3 { margin-bottom: 16px; }
.wbigdata .body .content ul { list-style: none; }
.wbigdata .body .content ul li { display: flex; border-bottom: 1px solid #DBE4EB; padding: 12px 0; }
.wbigdata .body .content ul li label { display: block; font-size: 14px; font-weight: 700; color: #40484E; width: 100px; padding-top: 4px; }
.wbigdata .body .content ul li input { width: 100%; padding: 4px 8px; }
.wbigdata .body .content ul li textarea { width: 100%; height: 300px; padding: 8px; }
.wbigdata .body .content ul li:not(.chips li):last-child { border-bottom: none; }

.wbigdata .body .content button { margin-top: 24px; padding: 12px 48px; float: right; }
</style>