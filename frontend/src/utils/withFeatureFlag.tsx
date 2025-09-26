export default function withFeatureFlag<P extends object>(
  featureKey: string,
) {
  return (props: P) => {
    return (
      <FeatureRender
        featureKey={featureKey}
        whenEnabled={<Component {...props} />}
        whenDisabled={}
          FallbackComponent ? <FallbackComponent {...props} /> : null
        }
      />
    );
  };
}
