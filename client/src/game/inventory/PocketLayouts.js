/**
 * Pocket Layout Definitions
 * Defines standard pocket configurations for clothing items.
 * This provides a single source of truth for pocket sizes and names.
 */

export const PocketLayouts = {
    // T-Shirt with single pocket
    'pocket_tee': {
        id: 'pocket_tee',
        name: 'Pocket Tee Layout',
        pockets: [
            { name: 'Chest Pocket', width: 1, height: 1 }
        ]
    },

    // Work Shirt (2 pockets)
    'work_shirt': {
        id: 'work_shirt',
        name: 'Work Shirt Pockets',
        pockets: [
            { id: 'left_chest', name: 'Left Breast', width: 1, height: 2 },
            { id: 'right_chest', name: 'Right Breast', width: 1, height: 2 }
        ]
    },
    'paramedic_shirt': {
        id: 'paramedic_shirt',
        name: 'Paramedic Shirt Pockets',
        pockets: [
            { id: 'cargo_left', name: 'Left Cargo', width: 2, height: 2 },
            { id: 'cargo_right', name: 'Right Cargo', width: 2, height: 2 },
            { id: 'front_left', name: 'Left Front', width: 2, height: 2 },
            { id: 'front_right', name: 'Right Front', width: 2, height: 2 }
        ]
    },
    'police_shirt': {
        id: 'police_shirt',
        name: 'Police Shirt Pockets',
        pockets: [
            { id: 'cargo_left', name: 'Left Cargo', width: 2, height: 2 },
            { id: 'cargo_right', name: 'Right Cargo', width: 2, height: 2 },
            { id: 'front_left', name: 'Left Front', width: 2, height: 2 },
            { id: 'front_right', name: 'Right Front', width: 2, height: 2 }
        ]
    },

    // Sweatpants (2 pockets)
    'sweatpants': {
        id: 'sweatpants',
        name: 'Sweatpants Layout',
        pockets: [
            { name: 'Left Pocket', width: 1, height: 2 },
            { name: 'Right Pocket', width: 1, height: 2 }
        ]
    },

    // Cargo Pants (4 pockets)
    'cargo_pants': {
        id: 'cargo_pants',
        name: 'Cargo Pants Layout',
        pockets: [
            { name: 'Front Left', width: 2, height: 2 },
            { name: 'Front Right', width: 2, height: 2 },
            { name: 'Cargo Left', width: 2, height: 2 },
            { name: 'Cargo Right', width: 2, height: 2 }
        ]
    }
};
