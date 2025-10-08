<script lang="ts" setup>
import { computed } from 'vue';

import ModalCard from '../ModalCard.vue';
import ThunderstoreCombo from '../../model/ThunderstoreCombo';
import { getStore } from '../../providers/generic/store/StoreProvider';
import { State } from '../../store';
import { InstallMode } from '../../utils/DependencyUtils';

const store = getStore<State>();

const isOpen = computed(() => store.state.modals.isUpdateAllModsModalOpen);
const modsWithUpdates = computed(() => store.getters['profile/modsWithUpdates']);

function closeModal() {
    store.commit("closeUpdateAllModsModal");
}

async function updateAllToLatestVersion() {
    closeModal();
    const combos: ThunderstoreCombo[] = await store.dispatch('profile/getCombosWithUpdates');

    await store.dispatch('download/downloadAndInstallCombos', {
        combos,
        profile: store.getters['profile/activeProfile'].asImmutableProfile(),
        game: store.state.activeGame,
        installMode: InstallMode.UPDATE_ALL
    });
}
</script>

<template>
    <ModalCard id="update-all-installed-mods-modal" :is-active="isOpen" :can-close="true" v-if="modsWithUpdates.length === 0" @close-modal="closeModal()">
        <template v-slot:header>
            <h2 class='modal-title'>没有 Mod 需要更新</h2>
        </template>
        <template v-slot:body>
            <p>要么所有已安装的 Mod 都是最新的，要么没有安装任何 Mod。</p>
        </template>
        <template v-slot:footer>
            <button class="button is-info" @click="closeModal()">关闭</button>
        </template>
    </ModalCard>
    <ModalCard id="update-all-installed-mods-modal" :is-active="isOpen" :can-close="true" v-else @close-modal="closeModal()">
        <template v-slot:header>
            <h2 class='modal-title'>更新所有已安装 Mod</h2>
        </template>
        <template v-slot:body>
            <p>所有安装的 Mod 都将更新到其最新版本。</p>
            <p>将安装任何缺失的前置模组。</p>
            <p>以下 Mod 将下载并安装：</p>
            <br/>
            <ul class="list">
                <li class="list-item" v-for='(mod, index) in modsWithUpdates'
                    :key='`to-update-${index}-${mod.getFullName()}`'>
                    {{mod.getName()}} 将更新到: {{mod.getLatestVersion()}}
                </li>
            </ul>
        </template>
        <template v-slot:footer>
            <button class="button is-info" @click="updateAllToLatestVersion()">全部更新</button>
        </template>
    </ModalCard>
</template>
