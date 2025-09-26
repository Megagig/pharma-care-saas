// Template Services
// Removed broken export
    templateRenderingEngine,
    TemplateRenderingEngine,
    MemoryTemplateCache

// Removed broken export
    templateValidationService,
    TemplateValidationService

// Removed broken export
    templateInheritanceService,
    TemplateInheritanceService

// Removed broken export
    templatePerformanceService,
    TemplatePerformanceService

// Export Services
// Removed incomplete export: export { exportServices 
export { scheduleService 
export { emailService 
// Export Types
export type {
    RenderContext,
    RenderResult,
    RenderedSection,
    RenderedContent,
    RenderedKPI,
    RenderedMetric,
    RenderedChart,
    RenderedTable,
    ComputedLayout,
    RenderMetadata,
    PerformanceMetrics,
    TemplateCache,
    ParameterBinding

export type {
    ValidationContext,
    ValidationResult,
    ValidationSuggestion,
    ValidationPerformance,
    ValidationRule

export type {
    TemplateInheritance,
    TemplateOverrides,
    SectionOverride,
    CompositionConfig,
    CompositionSource,
    CompositionRule,
    InheritanceResult,
    InheritanceConflict,
    TemplateComposition

export type {
    PerformanceOptimization,
    CacheConfig,
    LazyLoadConfig,
    VirtualizationConfig,
    CompressionConfig,
    PrecomputeConfig,
    OptimizationResult,
    OptimizationRecommendation,
    CacheEntry