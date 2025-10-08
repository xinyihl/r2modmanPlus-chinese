<template>
    <ExternalLink v-if="mod && mod.getDonationLink()"
          :url="mod.getDonationLink()"
          class="card-footer-item"
          v-tooltip.left="{content: '向模组作者捐款', distance: 0}">
        <i class='fas fa-heart margin-right margin-right--half-width'></i>
        捐赠
    </ExternalLink>
</template>

<script lang="ts" setup>
import ThunderstoreMod from '../../model/ThunderstoreMod';
import { ExternalLink } from '../../components/all';

type DonateButtonProps = {
    mod: ThunderstoreMod;
}

defineProps<DonateButtonProps>();
</script>
