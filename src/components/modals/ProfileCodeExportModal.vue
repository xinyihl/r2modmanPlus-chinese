<script lang="ts" setup>
import ModalCard from '../ModalCard.vue';
import { computed } from 'vue';
import { getStore } from '../../providers/generic/store/StoreProvider';
import { State } from '../../store';

const store = getStore<State>();
const isOpen = computed(() => store.state.modals.isProfileCodeExportModalOpen);

const exportCode = computed(() => store.state.profileExport.exportCode);

function closeModal() {
    store.commit("closeProfileCodeExportModal");
}
</script>

<template>
    <ModalCard id="profile-exported-modal" :is-active="isOpen" @close-modal="closeModal" :can-close="true">
        <template v-slot:header>
            <h2 class='modal-title'>播放集导出</h2>
        </template>
        <template v-slot:body>
            <p>
                你的代码：<strong>{{exportCode}}</strong> 已被复制到你的剪贴板。只需将其提供给朋友！
            </p>
        </template>
        <template v-slot:footer>
            <button class="button is-info" @click="closeModal">
                确定
            </button>
        </template>
    </ModalCard>

</template>
