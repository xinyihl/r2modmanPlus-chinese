<script setup lang="ts">
import { computed } from 'vue';
import ModalCard from '@r2/components/ModalCard.vue';
import { State } from '@r2/store';
import { getStore } from '@r2/providers/generic/store/StoreProvider';
import ManifestV2 from '@r2/model/ManifestV2';
import { useModManagementComposable } from '@r2/components/composables/ModManagementComposable';
import R2Error from '@r2/model/errors/R2Error';
import ProfileModList from '@r2/r2mm/mods/ProfileModList';

const store = getStore<State>();

const { uninstallMod } = useModManagementComposable();

const isOpen = computed(() => store.state.modals.isConcerningModReviewModalOpen);
const modToReview = computed<ManifestV2 | null>(() => store.state.modals.concerningModToReview);
const profile = computed(() => store.getters['profile/activeProfile']);

function close() {
    store.commit('closeConcerningModReviewModal');
}

async function removeMod() {
    await uninstallMod(modToReview.value!);
    close();
}

async function trustPackage() {
    const mods = await ProfileModList.getModList(profile.value.asImmutableProfile());
    if (mods instanceof R2Error) {
        console.error(mods);
        store.commit('error/handleError', mods);
        return;
    }
    const mod = mods.find(value => value.getName() === modToReview.value?.getName());
    if (mod) {
        mod.setTrustedPackage(true);
    }
    try {
        const err = await ProfileModList.saveModList(profile.value.asImmutableProfile(), mods);
        if (err instanceof R2Error) {
            store.commit('error/handleError', err);
            return;
        }
        await store.dispatch('profile/updateModList', mods);
    } catch (e) {
        store.commit('error/handleError', R2Error.fromThrownValue(e));
    } finally {
        close();
    }
}
</script>

<template>
    <ModalCard id="review-package-modal" v-if="isOpen && modToReview" :is-active="isOpen" :can-close="true"
        @close-modal="close">
        <template v-slot:header>
            <h2 class="modal-title">检查 {{ modToReview.getName() }}</h2>
        </template>
        <template v-slot:body>
            <p class="notification is-warning">通常建议移除已从 Thunderstore 下架的模组。</p>
            <div>
                <hr />
                <p class="margin-bottom">此模组最初从 Thunderstore 下载，但现已无法在该网站上找到。</p>
                <p class="margin-bottom">模组可能因作者请求、违反规则或正在审核中而被移除。</p>
                <p>其他人将无法从导出的配置文件中导入此模组。</p>
            </div>
        </template>
        <template v-slot:footer>
            <button class="button" @click.stop.prevent="trustPackage">
                标记版本为安全
            </button>
            <button class="button is-danger" @click.stop.prevent="removeMod">
                移除模组
            </button>
        </template>
    </ModalCard>
</template>

<style scoped lang="scss"></style>
