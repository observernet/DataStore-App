<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
    visible: { type: Boolean, default: false },
    title: { type: String, default: "알림" },
    message: { type: String, default: "내용이 없습니다." },
    confirmText: { type: String, default: "확인" },
    cancelText: { type: String, default: "취소" },
    closeOnBackdrop: { type: Boolean, default: true },
});

const emit = defineEmits(['close', 'confirm']);

function close() {
    emit('close');
}

function confirm() {
    emit('confirm');
}

function onBackdropClick() {
    if (props.closeOnBackdrop) close();
}
</script>

<template>
    <Teleport to="body">
        <Transition name="fade">
            <div v-if="visible" class="dialog-backdrop" @click.self="onBackdropClick">
                <div class="dialog-content">
                    <slot>
                        <div class="dialog-body">
                            <label class="dialog-icon"><img src="@/assets/images/caution.svg" width="24" height="24" /></label>
                            <h3 class="dialog-title">{{ title }}</h3>
                            <p class="dialog-message">{{ message }}</p>
                        </div>
                        <div class="dialog-actions">
                            <button class="cancel" @click="close">{{ cancelText }}</button>
                            <button class="ok" @click="confirm">{{ confirmText }}</button>
                        </div>
                    </slot>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.dialog-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.dialog-content { background: white; border-radius: 16px; min-width: 300px; max-width: 90%; padding: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.4); }
.dialog-body { padding-top: 8px; padding-bottom: 16px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.dialog-title { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
.dialog-message { font-size: 14px; font-weight: 500; margin-bottom: 16px; }
.dialog-actions { display: flex; gap: 8px; }
.dialog-actions button.cancel { flex: 1; background: #E5EBF0; color: #22262A; }
.dialog-actions button.ok { flex: 1; background: #22262A; color: #FFF; }
.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>