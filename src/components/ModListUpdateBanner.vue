<script lang="ts" setup>
import R2Error from '../model/errors/R2Error';
import { computed } from 'vue';
import { getStore } from '../providers/generic/store/StoreProvider';
import { State } from '../store';

const store = getStore<State>();

const isModListLoaded = computed<boolean>(() => store.state.tsMods.modsLastUpdated !== undefined);
const isUpdateInProgress = computed<boolean>(() => store.state.tsMods.isThunderstoreModListUpdateInProgress);
const updateError = computed<Error|undefined>(() => store.state.tsMods.thunderstoreModListUpdateError);

function updateModList() {
    store.dispatch('tsMods/syncPackageList');
}

function openErrorModal() {
    store.commit('error/handleError', R2Error.fromThrownValue(
        updateError.value,
        'Error updating the mod list from Thunderstore',
    ));
}
</script>

<template>
    <div v-if="!isModListLoaded" id="mod-list-update-banner" class="margin-bottom">
        <div class="notification is-warning margin-right">
            <span v-if="isUpdateInProgress">
                {{ store.state.tsMods.thunderstoreModListUpdateStatus }}
            </span>
            <span v-else-if="updateError">
                刷新模组列表错误。
                <a @click="openErrorModal">查看错误详细信息</a>.
                <br />
                将继续尝试在后台刷新模组列表。
            </span>
            <span v-else-if="store.getters['download/activeDownloadCount'] > 0">
                从 Thunderstore 中刷新模组列表时发生错误。<br />
                但是，在进行下载的模组下载时，模组列表无法刷新。<br />
                请等待下载结束，然后再继续。
            </span>
            <span v-else>
                从 Thunderstore 中刷新模组列表时会发生错误。
                你是否想要
                <a @click="updateModList">再试一次</a>
            </span>
        </div>
    </div>
</template>

<style scoped lang="scss">

</style>
