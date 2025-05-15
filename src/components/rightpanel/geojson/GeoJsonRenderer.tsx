
import { RenderStyle, NodeFeature, LinkFeature } from './GeoJsonTypes';

export class GeoJsonRenderer {
  private map: any; // naver.maps.Map
  private displayedObjects: any[] = [];
  private nodesById: Map<string, NodeFeature>;
  private linksById: Map<string, LinkFeature>;
  private linksByNodeId: Map<string, LinkFeature[]>;
  private defaultNodeStyle: RenderStyle = {
    fill: '#FF0000',
    radius: 5,
    zIndex: 100
  };
  private defaultLinkStyle: RenderStyle = {
    stroke: '#4CAF50',
    strokeWidth: 3,
    opacity: 0.8,
    zIndex: 90
  };

  constructor(
    map: any,
    nodesById: Map<string, NodeFeature>,
    linksById: Map<string, LinkFeature>,
    linksByNodeId: Map<string, LinkFeature[]>
  ) {
    this.map = map;
    this.nodesById = nodesById;
    this.linksById = linksById;
    this.linksByNodeId = linksByNodeId;
  }

  public clearDisplayedFeatures() {
    this.displayedObjects.forEach(obj => {
      if (obj && typeof obj.setMap === 'function') {
        obj.setMap(null);
      }
    });
    this.displayedObjects = [];
  }

  public renderRoute(nodeIds: string[], linkIds: string[], style?: RenderStyle) {
    const renderedObjects: any[] = [];

    // Render links first (so they appear behind nodes)
    if (linkIds && linkIds.length > 0) {
      linkIds.forEach(linkId => {
        const link = this.linksById.get(linkId);
        if (link) {
          const marker = this.renderLink(link, { 
            ...this.defaultLinkStyle, 
            ...style 
          });
          if (marker) {
            renderedObjects.push(marker);
            this.displayedObjects.push(marker);
          }
        }
      });
    }

    // Then render nodes
    if (nodeIds && nodeIds.length > 0) {
      nodeIds.forEach(nodeId => {
        const node = this.nodesById.get(nodeId);
        if (node) {
          const marker = this.renderNode(node, { 
            ...this.defaultNodeStyle, 
            ...style 
          });
          if (marker) {
            renderedObjects.push(marker);
            this.displayedObjects.push(marker);
          }
        }
      });
    }

    return renderedObjects;
  }

  public renderAllNetwork(options?: {nodeStyle?: RenderStyle, linkStyle?: RenderStyle}) {
    const renderedObjects: any[] = [];
    
    // Render all links first
    this.linksById.forEach(link => {
      const marker = this.renderLink(link, { 
        ...this.defaultLinkStyle,
        ...options?.linkStyle
      });
      if (marker) {
        renderedObjects.push(marker);
        this.displayedObjects.push(marker);
      }
    });

    // Then render all nodes
    this.nodesById.forEach(node => {
      const marker = this.renderNode(node, { 
        ...this.defaultNodeStyle,
        ...options?.nodeStyle
      });
      if (marker) {
        renderedObjects.push(marker);
        this.displayedObjects.push(marker);
      }
    });

    return renderedObjects;
  }

  private renderNode(node: NodeFeature, style: RenderStyle) {
    if (!node || !node.geometry || !node.geometry.coordinates) {
      console.warn('Invalid node geometry', node);
      return null;
    }

    try {
      const [lng, lat] = node.geometry.coordinates;
      const position = new window.naver.maps.LatLng(lat, lng);

      const marker = new window.naver.maps.Circle({
        map: this.map,
        center: position,
        radius: style.radius || 5,
        fillColor: style.fill || '#FF0000',
        fillOpacity: style.opacity !== undefined ? style.opacity : 0.8,
        strokeColor: style.stroke || style.fill || '#FF0000',
        strokeWeight: style.strokeWidth || 1,
        strokeOpacity: style.opacity !== undefined ? style.opacity : 0.8,
        zIndex: style.zIndex || 100,
      });

      return marker;
    } catch (e) {
      console.error('Error rendering node', e);
      return null;
    }
  }

  private renderLink(link: LinkFeature, style: RenderStyle) {
    if (!link || !link.geometry || !link.geometry.coordinates) {
      console.warn('Invalid link geometry', link);
      return null;
    }

    try {
      const path = link.geometry.coordinates.map(
        ([lng, lat]) => new window.naver.maps.LatLng(lat, lng)
      );

      const polyline = new window.naver.maps.Polyline({
        map: this.map,
        path: path,
        strokeColor: style.stroke || '#4CAF50',
        strokeWeight: style.strokeWidth || 3,
        strokeOpacity: style.opacity !== undefined ? style.opacity : 0.8,
        zIndex: style.zIndex || 90,
      });

      return polyline;
    } catch (e) {
      console.error('Error rendering link', e);
      return null;
    }
  }
}
