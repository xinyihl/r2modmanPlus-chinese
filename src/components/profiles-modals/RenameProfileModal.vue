<script lang="ts" setup>
import { ModalCard } from "../all";
import R2Error from "../../model/errors/R2Error";
import { useProfilesComposable } from '../composables/ProfilesComposable';
import { computed, nextTick, ref, watchEffect } from 'vue';
import { getStore } from '../../providers/generic/store/StoreProvider';
import { State } from '../../store';

const store = getStore<State>();

const {
    doesProfileExist,
    makeProfileNameSafe,
} = useProfilesComposable();

const nameInput = ref<HTMLInputElement>();
const newProfileName = ref<string>('');
const renamingInProgress = ref<boolean>(false);

const isOpen = computed(() => store.state.modals.isRenameProfileModalOpen);

watchEffect(() => {
    newProfileName.value = store.getters['profile/activeProfileName'];
})

watchEffect(() => {
    const openValue = store.state.modals.isRenameProfileModalOpen;
    if (openValue) {
        nextTick(() => {
            nameInput.value!.focus()
        })
    }
});

function closeModal() {
    renamingInProgress.value = false;
    newProfileName.value = store.state.profile.activeProfile.getProfileName();
    store.commit('closeRenameProfileModal');
}

async function performRename() {
    if (renamingInProgress.value) {
        return;
    }
    const safeName = makeProfileNameSafe(newProfileName.value);
    if (safeName !== '') {
        try {
            renamingInProgress.value = true;
            await store.dispatch('profiles/renameProfile', { newName: safeName });
        } catch (e) {
            const err = R2Error.fromThrownValue(e, 'Error whilst renaming profile');
            store.commit('error/handleError', err);
        }
        closeModal();
    }
}

</script>
<template>
    <ModalCard id="rename-profile-modal" v-if="isOpen" :is-active="isOpen" @close-modal="closeModal">

        <template v-slot:header>
            <h2 class="modal-title">重命名播放集</h2>
        </template>
        <template v-slot:body>
            <p>此播放集将独立于其他播放集存储自己的模组。</p>

            <input
                v-model="newProfileName"
                @keyup.enter="!doesProfileExist(newProfileName) && performRename()"
                id="rename-profile-modal-new-profile-name"
                class="input"
                ref="nameInput"
                autocomplete="off"
            />

            <span class="tag is-dark" v-if="newProfileName === '' || makeProfileNameSafe(newProfileName) === ''">
                需要播放集名称
            </span>
            <span class="tag is-success" v-else-if="!doesProfileExist(newProfileName)">
                "{{makeProfileNameSafe(newProfileName)}}" 可用
            </span>
            <span class="tag is-danger" v-else-if="doesProfileExist(newProfileName)">
                "{{makeProfileNameSafe(newProfileName)}}" 已在使用中，或包含无效字符
            </span>
        </template>
        <template v-slot:footer>
            <button class="button is-danger" v-if="doesProfileExist(newProfileName)" disabled>重命名</button>
            <button class="button is-info" @click="performRename()" :disabled="renamingInProgress" v-else>重命名</button>
        </template>

    </ModalCard>
</template>

<style lang="scss" scoped>
#rename-profile-modal-new-profile-name {
    display: block;
    margin-bottom: 1rem;
}
</style>
