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
      category: i.string().indexed().optional(), // missing_sidewalk, obstruction, broken_pavement, etc.

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

      // Computed walkability scores (4-bucket system)
      seguridadScore: i.number().optional(), // 0-5 points (SEGURIDAD bucket)
      utilidadScore: i.number().optional(), // 0-1 points (UTILIDAD bucket)
      comodidadScore: i.number().optional(), // 0-2 points (COMODIDAD bucket)
      interesanteScore: i.number().optional(), // 0-2 points (INTERESANTE bucket)
      totalScore: i.number().optional(), // 0-10 total walkability score
      walkabilityState: i.string().optional(), // JSON of full walkability state

      // Description and details
      description: i.string().optional(),
      severity: i.number().optional(), // 1-5

      // Location data
      lat: i.number(),
      lng: i.number(),
      address: i.string().optional(), // Human-readable address
      roadId: i.string().optional(), // OSM way ID (matched client-side)
      roadName: i.string().optional(),
      distanceFromRoad: i.number().optional(), // meters

      // Status and verification
      status: i.string().indexed().optional(), // pending, verified, resolved
      verified: i.boolean().optional(),

      // AI Analysis Tracking
      aiGenerated: i.boolean().optional(), // Was this report AI-drafted?
      aiConfidence: i.number().optional(), // Overall confidence 0-1
      aiRawResponse: i.string().optional(), // Full AI response JSON for evals
      userModified: i.boolean().optional(), // Did user change AI draft?
      aiModel: i.string().optional(), // e.g., "gpt-4o-mini"
      aiProcessedAt: i.number().optional(), // Timestamp of AI analysis

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
