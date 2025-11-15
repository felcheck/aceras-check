// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
    }),
    neighborhoods: i.entity({
      name: i.string(),
      description: i.string(),
      // Bounding box for the neighborhood
      bboxNorth: i.number(),
      bboxSouth: i.number(),
      bboxEast: i.number(),
      bboxWest: i.number(),
      createdAt: i.number().indexed(),
    }),
    reports: i.entity({
      // Report category
      category: i.string().indexed(), // missing_sidewalk, obstruction, broken_pavement, etc.

      // Ratings (1-5 scale)
      conditionRating: i.number().optional(),
      widthRating: i.number().optional(),
      safetyRating: i.number().optional(),
      lightingRating: i.number().optional(),
      accessibilityRating: i.number().optional(),

      // SEGURIDAD (Safety) fields
      hasSidewalk: i.boolean().optional(),
      hasLighting: i.boolean().optional(),
      comfortSpaceRating: i.number().optional(), // 1-5: buffer from traffic
      obstructions: i.json().optional(), // Array of obstruction types: huecos, interrupciones, carros_mal_estacionados, etc.

      // Computed walkability scores
      seguridadScore: i.number().optional(), // 0-5 points (SEGURIDAD bucket)

      // Description and details
      description: i.string(),
      severity: i.number().optional(), // 1-5

      // Location data
      lat: i.number(),
      lng: i.number(),
      roadId: i.string().optional(), // OSM way ID (matched client-side)
      roadName: i.string().optional(),
      distanceFromRoad: i.number().optional(), // meters

      // Status and verification
      status: i.string().indexed(), // pending, verified, resolved
      verified: i.boolean(),

      // Metadata
      createdAt: i.number().indexed(),
      updatedAt: i.number().optional(),
    }),
  },
  links: {
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
    reportAuthor: {
      forward: {
        on: "reports",
        has: "one",
        label: "author",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "reports",
      },
    },
    reportNeighborhood: {
      forward: {
        on: "reports",
        has: "one",
        label: "neighborhood",
      },
      reverse: {
        on: "neighborhoods",
        has: "many",
        label: "reports",
      },
    },
    reportPhotos: {
      forward: {
        on: "reports",
        has: "many",
        label: "photos",
      },
      reverse: {
        on: "$files",
        has: "one",
        label: "report",
      },
    },
  },
  rooms: {
    main: {
      presence: i.entity({}),
      topics: {
        newReport: i.entity({
          reportId: i.string(),
          lat: i.number(),
          lng: i.number(),
        }),
      },
    },
  },
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
