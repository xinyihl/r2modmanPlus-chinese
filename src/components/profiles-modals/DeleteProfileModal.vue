<script lang="ts" setup>
import { ModalCard } from "../all";
import R2Error from "../../model/errors/R2Error";
import { computed, ref } from 'vue';
import { getStore } from '../../providers/generic/store/StoreProvider';
import { State } from '../../store';

const store = getStore<State>();

const deletingInProgress = ref<boolean>(false);
const isOpen = computed(() => store.state.modals.isDeleteProfileModalOpen);

function closeDeleteProfileModal() {
    deletingInProgress.value = false;
    store.commit('closeDeleteProfileModal');
}

async function removeProfile() {
    if (deletingInProgress.value) {
        return;
    }
    try {
        deletingInProgress.value = true;
        await store.dispatch('profiles/removeSelectedProfile');
    } catch (e) {
        const err = R2Error.fromThrownValue(e, 'Error whilst deleting profile');
        store.commit('error/handleError', err);
    }
    closeDeleteProfileModal();
}

</script>
<template>
    <ModalCard id="delete-profile-modal" v-if="isOpen" :is-active="isOpen" @close-modal="closeDeleteProfileModal">

        <template v-slot:header>
            <h2 class="modal-title">删除播放集</h2>
        </template>
        <template v-slot:body>
            <p>这将删除此播放集中安装的所有模组及其配置文件。</p>
            <p>如果这是意外，请单击变暗区域或位于右上角的内部十字。</p>
            <p>您确定要删除此播放集吗？</p>
        </template>
        <template v-slot:footer>
            <button
                :disabled="deletingInProgress"
                class="button is-danger"
                @click="removeProfile()"
            >删除播放集</button>
        </template>

    </ModalCard>
</template>
