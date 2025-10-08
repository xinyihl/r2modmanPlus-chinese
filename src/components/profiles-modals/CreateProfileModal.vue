<script lang="ts" setup>
import { ModalCard } from '../all';
import R2Error from '../../model/errors/R2Error';
import { useProfilesComposable } from '../composables/ProfilesComposable';
import { computed, nextTick, ref, watch } from 'vue';
import { getStore } from '../../providers/generic/store/StoreProvider';
import { State } from '../../store';

const store = getStore<State>();

const {
    doesProfileExist,
    makeProfileNameSafe,
} = useProfilesComposable();

const nameInput = ref<HTMLInputElement>();
const creatingInProgress = ref<boolean>(false);
const newProfileName = ref<string>('');

const isOpen = computed<boolean>(() => store.state.modals.isCreateProfileModalOpen);

watch(isOpen, async (isNowOpen) => {
    if (isNowOpen) {
        await nextTick();
        nameInput.value && nameInput.value.focus();
    }
});

function closeModal() {
    newProfileName.value = '';
    creatingInProgress.value = false;
    store.commit('closeCreateProfileModal');
}

// User confirmed creation of a new profile with a name that didn't exist before.
async function createProfile() {
    if (creatingInProgress.value) {
        return;
    }
    const safeName = makeProfileNameSafe(newProfileName.value);
    if (safeName !== '') {
        try {
            creatingInProgress.value = true;
            await store.dispatch('profiles/addProfile', safeName);
            closeModal();
        } catch (e) {
            creatingInProgress.value = false;
            const err = R2Error.fromThrownValue(e, 'Error whilst creating a profile');
            store.commit('error/handleError', err);
        }
    }
}

</script>
<template>
    <ModalCard id="create-profile-modal" v-if="isOpen" :is-active="isOpen" @close-modal="closeModal">

        <template v-slot:header>
            <h2 class="modal-title">创建播放集</h2>
        </template>

        <template v-slot:body>
            <p>此播放集将独立于其他播放集存储自己的模组。</p>
            <br/>
            <input
                v-model="newProfileName"
                @keyup.enter="!doesProfileExist(newProfileName) && createProfile()"
                id="create-profile-modal-new-profile-name"
                class="input"
                ref="nameInput"
                autocomplete="off"
            />
            <br/><br/>
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
            <button id="modal-create-profile-invalid" class="button is-danger" v-if="doesProfileExist(newProfileName)" disabled>创建</button>
            <button id="modal-create-profile" class="button is-info" @click="createProfile()" :disabled="creatingInProgress" v-else>创建</button>
        </template>

    </ModalCard>
</template>
