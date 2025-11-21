// import { analysisActions, codeActions } from "@/actions/bevor";
// import ContainerBreadcrumb from "@/components/breadcrumbs";
// import Container from "@/components/container";
// import { CodeProvider } from "@/providers/code";
// import {
//   AnalysisMappingSchemaI,
//   AsyncComponent,
//   CodeMappingSchemaI,
//   TreeResponseI,
// } from "@/utils/types";
// import NewVersionClient from "./new-version-client";

import { AsyncComponent } from "@/utils/types";

// type ResolvedParams = {
//   teamSlug: string;
//   analysisId: string;
// };

// type Props = {
//   params: Promise<ResolvedParams>;
//   searchParams: Promise<{
//     codeVersionId?: string;
//     parentVersionId?: string;
//   }>;
// };

// /*
// Multiple ways to enter this page, to create a better UX:
// 1. from the analysis thread.
// 2. from an existing analysis version.
// 3. from a code version (we'll require they select an analysis thread prior to navigation).

// To create an analysis version, we need 2 things:
// 1. the code version
// 2. the parent analysis version (nullable)

// Now consider:
// 1. Neither query param is passed
// -> use most recent analysis version as the default parent. Use its associated code version as the default
// code version. If no recent analysis version exists, then leave parent blank, and use most recent code
// version as the default code version. If no recent code version exists, add a CTA to create one.
// 2. Both query params are passed
// -> validate that both are valid
// 3. code version only
// -> validate it. Use the most recent analysis version as the default parent
// 4. parent only
// -> validate it. Use the associated code version as the default code version.

// */

// const AnalysisPage: AsyncComponent<Props> = async ({ params, searchParams }) => {
//   const resolvedParams = await params;
//   const { codeVersionId, parentVersionId } = await searchParams;

//   let tree: TreeResponseI[] = [];
//   let defaultCodeVersion: CodeMappingSchemaI | undefined;
//   let defaultParentVersion: AnalysisMappingSchemaI | undefined;

//   const analysis = await analysisActions.getAnalysis(
//     resolvedParams.teamSlug,
//     resolvedParams.analysisId,
//   );

//   if (!codeVersionId && !parentVersionId) {
//     const parentVersion = await analysisActions.getAnalysisRecentVersion(
//       resolvedParams.teamSlug,
//       resolvedParams.analysisId,
//     );
//     if (parentVersion) {
//       defaultParentVersion = parentVersion;
//       defaultCodeVersion = await codeActions.getCodeVersion(
//         resolvedParams.teamSlug,
//         parentVersion.version.code_version_id,
//       );
//       tree = await codeActions.getTree(resolvedParams.teamSlug, defaultCodeVersion.id);
//     } else {
//       const recentCodeVersion = await analysisActions.getAnalysisRecentCodeVersion(
//         resolvedParams.teamSlug,
//         resolvedParams.analysisId,
//       );
//       if (recentCodeVersion) {
//         defaultCodeVersion = recentCodeVersion;
//         tree = await codeActions.getTree(resolvedParams.teamSlug, defaultCodeVersion.id);
//       }
//     }
//   } else if (codeVersionId && parentVersionId) {
//     defaultParentVersion = await analysisActions.getAnalysisVersion(
//       resolvedParams.teamSlug,
//       parentVersionId,
//     );
//     defaultCodeVersion = await codeActions.getCodeVersion(resolvedParams.teamSlug, codeVersionId);
//     tree = await codeActions.getTree(resolvedParams.teamSlug, codeVersionId);
//   } else if (codeVersionId) {
//     defaultCodeVersion = await codeActions.getCodeVersion(resolvedParams.teamSlug, codeVersionId);
//     tree = await codeActions.getTree(resolvedParams.teamSlug, codeVersionId);
//     if (!defaultParentVersion) {
//       const parentVersion = await analysisActions.getAnalysisRecentVersion(
//         resolvedParams.teamSlug,
//         resolvedParams.analysisId,
//       );
//       defaultParentVersion = parentVersion ?? undefined;
//     }
//   } else if (parentVersionId) {
//     defaultParentVersion = await analysisActions.getAnalysisVersion(
//       resolvedParams.teamSlug,
//       parentVersionId,
//     );
//     defaultCodeVersion = await codeActions.getCodeVersion(
//       resolvedParams.teamSlug,
//       defaultParentVersion.version.code_version_id,
//     );
//     tree = await codeActions.getTree(resolvedParams.teamSlug, defaultCodeVersion.id);
//   }

//   const initialSourceId = tree.length ? tree[0].id : null;

//   return (
//     <CodeProvider
//       initialSourceId={initialSourceId}
//       teamSlug={resolvedParams.teamSlug}
//       codeId={defaultCodeVersion?.id ?? null}
//     >
//       <Container
//         breadcrumb={
//           <ContainerBreadcrumb
//             queryKey={[resolvedParams.analysisId]}
//             queryType="analysis-new-version"
//             teamSlug={resolvedParams.teamSlug}
//             id={resolvedParams.analysisId}
//           />
//         }
//       >
//         <NewVersionClient
//           tree={tree}
//           teamSlug={resolvedParams.teamSlug}
//           analysis={analysis}
//           defaultParentVersion={defaultParentVersion}
//           defaultCodeVersion={defaultCodeVersion}
//           allowCodeVersionChange={!codeVersionId}
//         />
//       </Container>
//     </CodeProvider>
//   );
// };

// export default AnalysisPage;
const Page: AsyncComponent = async () => <></>;

export default Page;
