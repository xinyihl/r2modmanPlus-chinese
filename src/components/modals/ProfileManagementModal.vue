<script lang="ts" setup>
import ModalCard from '../ModalCard.vue';
import { computed, getCurrentInstance, onMounted } from 'vue';
import SettingsItem from '../settings-components/SettingsItem.vue';
import VueRouter from 'vue-router';
import R2Error from '../../model/errors/R2Error';
import { getStore } from '../../providers/generic/store/StoreProvider';
import { State } from '../../store';

const store = getStore<State>();
let router!: VueRouter;

onMounted(() => {
    router = getCurrentInstance()!.proxy.$router;
})

const isOpen = computed(() => store.state.modals.isProfileManagementModalOpen);

function closeModal() {
    store.commit('closeProfileManagementModal');
}

async function changeProfile() {
    store.commit("closeProfileManagementModal");
    router.push({name: 'profiles'});
}

async function exportProfileAsFile() {
    try {
        await store.dispatch("profileExport/exportProfileAsFile");
    } catch (e) {
        store.commit('error/handleError', R2Error.fromThrownValue(e));
    }
    store.commit("closeProfileManagementModal");
}

async function exportProfileAsCode() {
    try {
        await store.dispatch("profileExport/exportProfileAsCode");
    } catch (e) {
        store.commit('error/handleError', R2Error.fromThrownValue(e));
    }
    store.commit("closeProfileManagementModal");
}

async function importLocalMod() {
    store.commit("openLocalFileImportModal");
    store.commit("closeProfileManagementModal");
}
</script>

<template>
    <ModalCard id="profile-management-modal" :can-close="true" :is-active="isOpen" @close-modal="closeModal">
        <template v-slot:header>
            <h2 class='modal-title non-selectable'>播放集</h2>
        </template>
        <template v-slot:body>
            <SettingsItem
                action="切换播放集"
                description="返回到播放集选择界面"
                icon="fa-file-import"
                :value="async () => undefined"
                @click="changeProfile" />
            <SettingsItem
                action="导出播放集为文件"
                description="将你的模组列表和配置导出为一个文件"
                icon="fa-file-alt"
                :value="async () => undefined"
                @click="exportProfileAsFile"
            />
            <SettingsItem
                action="导出播放集为分享码"
                description="将你的模组列表和配置导出为分享码"
                icon="fa-cloud-upload-alt"
                :value="async () => undefined"
                @click="exportProfileAsCode"
            />
            <SettingsItem
                action="导入本地模组"
                description="从你的文件中离线安装模组"
                icon="fa-file-import"
                :value="async () => '并非所有模组都能本地安装'"
                @click="importLocalMod"
            />
        </template>
        <template v-slot:footer>
            <button class="button is-info" @click="closeModal">关闭</button>
        </template>
    </ModalCard>
</template>
