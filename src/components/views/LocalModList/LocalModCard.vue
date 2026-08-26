<script lang="ts" setup>
import { ExpandableCard, ExternalLink } from '../../all';
import DonateButton from '../../buttons/DonateButton.vue';
import DonateIconButton from '../../buttons/DonateIconButton.vue';
import R2Error from '../../../model/errors/R2Error';
import ManifestV2 from '../../../model/ManifestV2';
import VersionNumber from '../../../model/VersionNumber';
import { LogSeverity } from '../../../providers/ror2/logging/LoggerProvider';
import Dependants from '../../../r2mm/mods/Dependants';
import { useModIcon } from '../../composables/ModIconComposable';
import { valueToReadableDate } from '../../../utils/DateUtils';
import { splitToNameAndVersion } from '../../../utils/DependencyUtils';
import { computed, ref } from 'vue';
import { getStore } from '../../../providers/generic/store/StoreProvider';
import { State } from '../../../store';
import { UnsatisfiedDependencies } from '../../../store/modules/ProfileModule';
import ThunderstoreMod from "../../../model/ThunderstoreMod";
import ThunderstoreVersion from "../../../model/ThunderstoreVersion";
import { useConcerningPackageComposable } from '@r2/components/composables/ConcerningPackageComposable';
import { useModManagementComposable } from '@r2/components/composables/ModManagementComposable';

const store = getStore<State>();

type LocalModCardProps = {
    mod: ManifestV2;
    version?: ThunderstoreVersion | undefined;
}

const props = defineProps<LocalModCardProps>();

const { isConcerningPackage, wasConcerningPackage } = useConcerningPackageComposable();
const { uninstallMod } = useModManagementComposable();

const disableChangePending = ref<boolean>(false);
const icon = useModIcon(() => props.mod);

// Mod loader packages can't be disabled as it's hard to define
// what that should even do in all cases.
const canBeDisabled = computed(() => !store.getters['isModLoader'](props.mod.getName()));

const isDeprecated = computed(() => store.state.tsMods.deprecated.get(props.mod.getName()) || false);
const isLatestVersion = computed(() => store.getters['tsMods/isLatestVersion'](props.mod));
const localModList = computed(() => store.state.profile.modList);
const tsMod = computed<ThunderstoreMod>(() => store.getters['tsMods/tsMod'](props.mod));

const unsatisfiedDependencies = computed<UnsatisfiedDependencies | undefined>(() =>
    store.getters['profile/unsatisfiedDependencies'].get(props.mod.getName())
);
const disabledDependencies = computed<ManifestV2[]>(() => unsatisfiedDependencies.value?.disabledDependencies ?? []);
const missingDependencies = computed<string[]>(() => unsatisfiedDependencies.value?.missingDependencies ?? []);

async function disableMod() {
    if (disableChangePending.value) {
        return;
    }

    disableChangePending.value = true;
    const dependants = Dependants.getDependantList(props.mod, localModList.value);

    for (const mod of dependants) {
        if (mod.isEnabled()) {
            store.commit('openDisableModModal', props.mod);
            disableChangePending.value = false;
            return;
        }
    }

    try {
        await store.dispatch(
            'profile/disableModsFromActiveProfile',
            { mods: [props.mod] }
        );
    } catch (e) {
        store.commit('error/handleError', {
            error: R2Error.fromThrownValue(e),
            severity: LogSeverity.ACTION_STOPPED
        });
    }

    disableChangePending.value = false;
}

async function enableMod(mod: ManifestV2) {
    if (disableChangePending.value) {
        return;
    }

    disableChangePending.value = true;
    const dependencies = Dependants.getDependencyList(mod, localModList.value);

    try {
        await store.dispatch(
            'profile/enableModsOnActiveProfile',
            { mods: [...dependencies, mod] }
        );
    } catch (e) {
        store.commit('error/handleError', {
            error: R2Error.fromThrownValue(e),
            severity: LogSeverity.ACTION_STOPPED
        });
    }

    disableChangePending.value = false;
}

function updateMod() {
    if (tsMod.value !== undefined) {
        store.commit('openDownloadModVersionSelectModal', tsMod.value);
    }
}

function downloadDependency(dependencyString: string) {
    const [name, version] = splitToNameAndVersion(dependencyString);
    const partialManifest = new ManifestV2();
    partialManifest.setName(name);
    partialManifest.setVersionNumber(new VersionNumber(version));
    const dependency = store.getters['tsMods/tsMod'](partialManifest);

    if (dependency === undefined) {
        const error = new R2Error(
            `${dependencyString} could not be found`,
            'You may be offline, or the mod was removed from Thunderstore.',
            'The dependency may not yet be published to Thunderstore and may be available elsewhere.'
        );
        store.commit('error/handleError', error);
        return;
    }
    store.commit('openDownloadModVersionSelectModal', dependency);
}

function viewAssociatedMods() {
    store.commit('openAssociatedModsModal', props.mod);
}

// Need to wrap util call in method to allow access from Vue context
function getReadableDate(value: number): string {
    return valueToReadableDate(value);
}

function dependencyStringToModName(x: string) {
    return x.substring(0, x.lastIndexOf('-'));
}

function openReviewModal() {
    store.commit('openConcerningModReviewModal', props.mod);
}
</script>

<template>
    <ExpandableCard :description="mod.getDescription()" :enabled="mod.isEnabled()"
        :id="`${mod.getAuthorName()}-${mod.getName()}-${mod.getVersionNumber()}`" :image="icon" :allowSorting="true"
        :class="[{ 'card--is-concern': isConcerningPackage(props.mod) }]">

        <template v-slot:title>
            <span class="non-selectable">
                <span v-if="isDeprecated" class="tag is-danger margin-right margin-right--half-width"
                    v-tooltip.right="'这个模组被弃用了，可能无法使用'">
                    已弃用
                </span>
                <span v-if="!mod.isEnabled()" class="tag is-warning margin-right margin-right--half-width"
                    v-tooltip.right="'此模组不会在游戏中使用'">
                    已禁用
                </span>
                <span class="card-title selectable">
                    <component :is="mod.isEnabled() ? 'span' : 'strike'" class="selectable">
                        {{ mod.getDisplayName() }}
                        <span class="selectable card-byline">
                            v{{ mod.getVersionNumber() }}
                        </span>
                        <span :class="`card-byline ${mod.isEnabled() && 'selectable'}`">
                            by {{ mod.getAuthorName() }}
                        </span>
                    </component>
                </span>
            </span>
        </template>

        <template v-slot:description>
            <p class='card-timestamp' v-if="mod.getInstalledAtTime() !== 0"><strong>安装于:</strong> {{
                getReadableDate(mod.getInstalledAtTime()) }}</p>
            <p class='card-timestamp' v-if="version && version.getDateCreated()"><strong>发布于:</strong>
                {{ getReadableDate(version!.getDateCreated()!.getTime()) }}
            </p>
            <div class="notification is-warning" v-if="isConcerningPackage(props.mod)">
                <p>此模组最初从 Thunderstore 下载，但现已无法在该网站上找到。</p>
                <p><strong>建议你移除该模组。</strong></p>
                <button class="button" @click.stop.prevent="openReviewModal">
                    评价模组
                </button>
            </div>
        </template>

        <!-- Show icon button row even when card is collapsed -->
        <template v-slot:other-icons>
            <span v-if="wasConcerningPackage(props.mod)" class='card-header-icon'>
                <i v-tooltip.left="`This package can no longer be found on Thunderstore`" class='fas fa-unlink'></i>
            </span>
            <DonateIconButton :mod="tsMod" v-if="tsMod" />
            <span v-if="!isLatestVersion" @click.prevent.stop="updateMod()" class='card-header-icon'>
                <i class='fas fa-cloud-upload-alt' v-tooltip.left="'有更新可用'"></i>
            </span>
            <span v-if="disabledDependencies.length || missingDependencies.length" class='card-header-icon'>
                <i v-tooltip.left="`此模组的依赖关系存在问题`" class='fas fa-exclamation-circle'></i>
            </span>
            <span v-if="canBeDisabled" @click.prevent.stop="() => mod.isEnabled() ? disableMod() : enableMod(mod)"
                class='card-header-icon'>
                <div class="field">
                    <input :id="`switch-${mod.getName()}`" type="checkbox"
                        :class="['switch', 'is-small', { 'switch is-info': mod.isEnabled() }]"
                        :checked="mod.isEnabled()" />
                    <label :for="`switch-${mod.getName()}`" v-tooltip.left="mod.isEnabled() ? '禁用' : '启用'"></label>
                </div>
            </span>
        </template>

        <!-- Show bottom button row -->
        <button @click="uninstallMod(props.mod)" class='button'>
            卸载
        </button>

        <button v-if="canBeDisabled && mod.isEnabled()" @click="disableMod()" class='button'>
            禁用
        </button>
        <button v-else-if="canBeDisabled && !mod.isEnabled()" @click="enableMod(mod)" class='button'>
            启用
        </button>

        <button @click="viewAssociatedMods()" class='button'>
            相关
        </button>

        <ExternalLink :url="mod.getWebsiteUrl()" class="button">
            网站
            <i class="fas fa-external-link-alt margin-left margin-left--half-width"></i>
        </ExternalLink>

        <button v-if="!isLatestVersion" @click="updateMod()" class='button'>
            更新
        </button>

        <button v-if="missingDependencies.length" @click="downloadDependency(missingDependencies[0]!)" class='button'>
            下载依赖
        </button>

        <button v-if="disabledDependencies.length" @click="enableMod(disabledDependencies[0]!)" class='button'>
            Enable {{ disabledDependencies[0].getDisplayName() }}
        </button>

        <DonateButton v-if="tsMod" :mod="tsMod" />
        <DonateButton v-if="tsMod" :mod="tsMod" />
    </ExpandableCard>
</template>

<style scoped lang="scss">
.switch {
    position: relative;
}
</style>
