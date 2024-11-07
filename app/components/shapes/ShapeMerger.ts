import { Shape } from './ShapeClasses';

type Point = number[];
type LineSegment = [Point, Point];

const getAllShapeEdges = (shapes: Shape[]): LineSegment[] => {
    return shapes.flatMap(shape => getShapeEdges(shape.getVertices()));
};

const getShapeEdges = (vertices: Point[]): LineSegment[] => {
    const edges: LineSegment[] = [];
    for (let i = 0; i < vertices.length; i++) {
        const j = (i + 1) % vertices.length;
        edges.push([vertices[i], vertices[j]]);
    }
    return edges;
};

const isEdgeFromShape = (edge: LineSegment, shape: Shape): boolean => {
    const vertices = shape.getVertices();
    for (let i = 0; i < vertices.length; i++) {
        const j = (i + 1) % vertices.length;
        if (arePointsEqual(edge[0], vertices[i]) && arePointsEqual(edge[1], vertices[j]) ||
            arePointsEqual(edge[0], vertices[j]) && arePointsEqual(edge[1], vertices[i])) {
            return true;
        }
    }
    return false;
};

const arePointsEqual = (p1: Point, p2: Point): boolean => {
    return Math.abs(p1[0] - p2[0]) < 0.001 && Math.abs(p1[1] - p2[1]) < 0.001;
};

const isEdgeShared = (edge: LineSegment, shapes: Shape[]): boolean => {
    let sharedCount = 0;
    for (const shape of shapes) {
        if (isEdgeFromShape(edge, shape)) {
            sharedCount++;
            if (sharedCount > 1) return true;
        }
    }
    return false;
};

export const mergeShapes = (shapes: Shape[]): Point[] => {
    if (shapes.length === 0) return [];
    if (shapes.length === 1) return shapes[0].getVertices();

    const allEdges = getAllShapeEdges(shapes);
    const outlineEdges = allEdges.filter(edge => !isEdgeShared(edge, shapes));

    // Sort edges to form a continuous outline
    const outline: Point[] = [];
    let currentEdge = outlineEdges[0];
    outline.push(currentEdge[0]);

    while (outlineEdges.length > 0) {
        const index = outlineEdges.indexOf(currentEdge);
        outlineEdges.splice(index, 1);
        outline.push(currentEdge[1]);

        if (outlineEdges.length === 0) break;

        const nextEdge = outlineEdges.find(edge => 
            arePointsEqual(edge[0], currentEdge[1]) ||
            arePointsEqual(edge[1], currentEdge[1])
        );

        if (!nextEdge) break;

        // If the endpoints are reversed, swap them
        if (arePointsEqual(nextEdge[1], currentEdge[1])) {
            currentEdge = [nextEdge[1], nextEdge[0]];
        } else {
            currentEdge = nextEdge;
        }
    }

    return outline;
};