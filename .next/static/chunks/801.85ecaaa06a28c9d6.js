"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[801],{1801:function(e,t,n){let i,r;n.r(t),n.d(t,{default:function(){return k}});var s=n(8357),a=n(921),o=n(440),l=n(3691),d=n(9515),c=n(2677),u=n(1869);let f=new u.Box3,p=new u.Vector3;class h extends u.InstancedBufferGeometry{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry",this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new u.Float32BufferAttribute([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new u.Float32BufferAttribute([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,n=this.attributes.instanceEnd;return void 0!==t&&(t.applyMatrix4(e),n.applyMatrix4(e),t.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let n=new u.InstancedInterleavedBuffer(t,6,1);return this.setAttribute("instanceStart",new u.InterleavedBufferAttribute(n,3,0)),this.setAttribute("instanceEnd",new u.InterleavedBufferAttribute(n,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,t=3){let n;e instanceof Float32Array?n=e:Array.isArray(e)&&(n=new Float32Array(e));let i=new u.InstancedInterleavedBuffer(n,2*t,1);return this.setAttribute("instanceColorStart",new u.InterleavedBufferAttribute(i,t,0)),this.setAttribute("instanceColorEnd",new u.InterleavedBufferAttribute(i,t,t)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new u.WireframeGeometry(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){null===this.boundingBox&&(this.boundingBox=new u.Box3);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;void 0!==e&&void 0!==t&&(this.boundingBox.setFromBufferAttribute(e),f.setFromBufferAttribute(t),this.boundingBox.union(f))}computeBoundingSphere(){null===this.boundingSphere&&(this.boundingSphere=new u.Sphere),null===this.boundingBox&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(void 0!==e&&void 0!==t){let n=this.boundingSphere.center;this.boundingBox.getCenter(n);let i=0;for(let r=0,s=e.count;r<s;r++)p.fromBufferAttribute(e,r),i=Math.max(i,n.distanceToSquared(p)),p.fromBufferAttribute(t,r),i=Math.max(i,n.distanceToSquared(p));this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}var m=n(3400);class v extends u.ShaderMaterial{constructor(e){super({type:"LineMaterial",uniforms:u.UniformsUtils.clone(u.UniformsUtils.merge([u.UniformsLib.common,u.UniformsLib.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new u.Vector2(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
				#include <common>
				#include <fog_pars_vertex>
				#include <logdepthbuf_pars_vertex>
				#include <clipping_planes_pars_vertex>

				uniform float linewidth;
				uniform vec2 resolution;

				attribute vec3 instanceStart;
				attribute vec3 instanceEnd;

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
						attribute vec4 instanceColorStart;
						attribute vec4 instanceColorEnd;
					#else
						varying vec3 vLineColor;
						attribute vec3 instanceColorStart;
						attribute vec3 instanceColorEnd;
					#endif
				#endif

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#ifdef USE_DASH

					uniform float dashScale;
					attribute float instanceDistanceStart;
					attribute float instanceDistanceEnd;
					varying float vLineDistance;

				#endif

				void trimSegment( const in vec4 start, inout vec4 end ) {

					// trim end segment so it terminates between the camera plane and the near plane

					// conservative estimate of the near plane
					float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
					float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
					float nearEstimate = - 0.5 * b / a;

					float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

					end.xyz = mix( start.xyz, end.xyz, alpha );

				}

				void main() {

					#ifdef USE_COLOR

						vLineColor = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

					#endif

					#ifdef USE_DASH

						vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
						vUv = uv;

					#endif

					float aspect = resolution.x / resolution.y;

					// camera space
					vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
					vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

					#ifdef WORLD_UNITS

						worldStart = start.xyz;
						worldEnd = end.xyz;

					#else

						vUv = uv;

					#endif

					// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
					// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
					// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
					// perhaps there is a more elegant solution -- WestLangley

					bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

					if ( perspective ) {

						if ( start.z < 0.0 && end.z >= 0.0 ) {

							trimSegment( start, end );

						} else if ( end.z < 0.0 && start.z >= 0.0 ) {

							trimSegment( end, start );

						}

					}

					// clip space
					vec4 clipStart = projectionMatrix * start;
					vec4 clipEnd = projectionMatrix * end;

					// ndc space
					vec3 ndcStart = clipStart.xyz / clipStart.w;
					vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

					// direction
					vec2 dir = ndcEnd.xy - ndcStart.xy;

					// account for clip-space aspect ratio
					dir.x *= aspect;
					dir = normalize( dir );

					#ifdef WORLD_UNITS

						// get the offset direction as perpendicular to the view vector
						vec3 worldDir = normalize( end.xyz - start.xyz );
						vec3 offset;
						if ( position.y < 0.5 ) {

							offset = normalize( cross( start.xyz, worldDir ) );

						} else {

							offset = normalize( cross( end.xyz, worldDir ) );

						}

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );

						// don't extend the line if we're rendering dashes because we
						// won't be rendering the endcaps
						#ifndef USE_DASH

							// extend the line bounds to encompass  endcaps
							start.xyz += - worldDir * linewidth * 0.5;
							end.xyz += worldDir * linewidth * 0.5;

							// shift the position of the quad so it hugs the forward edge of the line
							offset.xy -= dir * forwardOffset;
							offset.z += 0.5;

						#endif

						// endcaps
						if ( position.y > 1.0 || position.y < 0.0 ) {

							offset.xy += dir * 2.0 * forwardOffset;

						}

						// adjust for linewidth
						offset *= linewidth * 0.5;

						// set the world position
						worldPos = ( position.y < 0.5 ) ? start : end;
						worldPos.xyz += offset;

						// project the worldpos
						vec4 clip = projectionMatrix * worldPos;

						// shift the depth of the projected points so the line
						// segments overlap neatly
						vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
						clip.z = clipPose.z * clip.w;

					#else

						vec2 offset = vec2( dir.y, - dir.x );
						// undo aspect ratio adjustment
						dir.x /= aspect;
						offset.x /= aspect;

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						// endcaps
						if ( position.y < 0.0 ) {

							offset += - dir;

						} else if ( position.y > 1.0 ) {

							offset += dir;

						}

						// adjust for linewidth
						offset *= linewidth;

						// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
						offset /= resolution.y;

						// select end
						vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

						// back to clip space
						offset *= clip.w;

						clip.xy += offset;

					#endif

					gl_Position = clip;

					vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

					#include <logdepthbuf_vertex>
					#include <clipping_planes_vertex>
					#include <fog_vertex>

				}
			`,fragmentShader:`
				uniform vec3 diffuse;
				uniform float opacity;
				uniform float linewidth;

				#ifdef USE_DASH

					uniform float dashOffset;
					uniform float dashSize;
					uniform float gapSize;

				#endif

				varying float vLineDistance;

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#include <common>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <clipping_planes_pars_fragment>

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
					#else
						varying vec3 vLineColor;
					#endif
				#endif

				vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

					float mua;
					float mub;

					vec3 p13 = p1 - p3;
					vec3 p43 = p4 - p3;

					vec3 p21 = p2 - p1;

					float d1343 = dot( p13, p43 );
					float d4321 = dot( p43, p21 );
					float d1321 = dot( p13, p21 );
					float d4343 = dot( p43, p43 );
					float d2121 = dot( p21, p21 );

					float denom = d2121 * d4343 - d4321 * d4321;

					float numer = d1343 * d4321 - d1321 * d4343;

					mua = numer / denom;
					mua = clamp( mua, 0.0, 1.0 );
					mub = ( d1343 + d4321 * ( mua ) ) / d4343;
					mub = clamp( mub, 0.0, 1.0 );

					return vec2( mua, mub );

				}

				void main() {

					#include <clipping_planes_fragment>

					#ifdef USE_DASH

						if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

						if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

					#endif

					float alpha = opacity;

					#ifdef WORLD_UNITS

						// Find the closest points on the view ray and the line segment
						vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
						vec3 lineDir = worldEnd - worldStart;
						vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

						vec3 p1 = worldStart + lineDir * params.x;
						vec3 p2 = rayEnd * params.y;
						vec3 delta = p1 - p2;
						float len = length( delta );
						float norm = len / linewidth;

						#ifndef USE_DASH

							#ifdef USE_ALPHA_TO_COVERAGE

								float dnorm = fwidth( norm );
								alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

							#else

								if ( norm > 0.5 ) {

									discard;

								}

							#endif

						#endif

					#else

						#ifdef USE_ALPHA_TO_COVERAGE

							// artifacts appear on some hardware if a derivative is taken within a conditional
							float a = vUv.x;
							float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
							float len2 = a * a + b * b;
							float dlen = fwidth( len2 );

							if ( abs( vUv.y ) > 1.0 ) {

								alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

							}

						#else

							if ( abs( vUv.y ) > 1.0 ) {

								float a = vUv.x;
								float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
								float len2 = a * a + b * b;

								if ( len2 > 1.0 ) discard;

							}

						#endif

					#endif

					vec4 diffuseColor = vec4( diffuse, alpha );
					#ifdef USE_COLOR
						#ifdef USE_LINE_COLOR_ALPHA
							diffuseColor *= vLineColor;
						#else
							diffuseColor.rgb *= vLineColor;
						#endif
					#endif

					#include <logdepthbuf_fragment>

					gl_FragColor = diffuseColor;

					#include <tonemapping_fragment>
					#include <${m.i>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(e){this.uniforms.diffuse.value=e}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(e){!0===e?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(e){this.uniforms.linewidth.value=e}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(e){!!e!="USE_DASH"in this.defines&&(this.needsUpdate=!0),!0===e?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(e){this.uniforms.dashScale.value=e}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(e){this.uniforms.dashSize.value=e}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(e){this.uniforms.dashOffset.value=e}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(e){this.uniforms.gapSize.value=e}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(e){this.uniforms.opacity.value=e}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(e){this.uniforms.resolution.value.copy(e)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(e){!!e!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),!0===e?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}let x=m.i>=125?"uv1":"uv2",g=new u.Vector4,y=new u.Vector3,b=new u.Vector3,w=new u.Vector4,S=new u.Vector4,E=new u.Vector4,_=new u.Vector3,A=new u.Matrix4,M=new u.Line3,j=new u.Vector3,L=new u.Box3,U=new u.Sphere,C=new u.Vector4;function z(e,t,n){return C.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),C.multiplyScalar(1/C.w),C.x=r/n.width,C.y=r/n.height,C.applyMatrix4(e.projectionMatrixInverse),C.multiplyScalar(1/C.w),Math.abs(Math.max(C.x,C.y))}class B extends u.Mesh{constructor(e=new h,t=new v({color:16777215*Math.random()})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,n=e.attributes.instanceEnd,i=new Float32Array(2*t.count);for(let e=0,r=0,s=t.count;e<s;e++,r+=2)y.fromBufferAttribute(t,e),b.fromBufferAttribute(n,e),i[r]=0===r?0:i[r-1],i[r+1]=i[r]+y.distanceTo(b);let r=new u.InstancedInterleavedBuffer(i,2,1);return e.setAttribute("instanceDistanceStart",new u.InterleavedBufferAttribute(r,1,0)),e.setAttribute("instanceDistanceEnd",new u.InterleavedBufferAttribute(r,1,1)),this}raycast(e,t){let n,s;let a=this.material.worldUnits,o=e.camera;null!==o||a||console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');let l=void 0!==e.params.Line2&&e.params.Line2.threshold||0;i=e.ray;let d=this.matrixWorld,c=this.geometry,f=this.material;if(r=f.linewidth+l,null===c.boundingSphere&&c.computeBoundingSphere(),U.copy(c.boundingSphere).applyMatrix4(d),a)n=.5*r;else{let e=Math.max(o.near,U.distanceToPoint(i.origin));n=z(o,e,f.resolution)}if(U.radius+=n,!1!==i.intersectsSphere(U)){if(null===c.boundingBox&&c.computeBoundingBox(),L.copy(c.boundingBox).applyMatrix4(d),a)s=.5*r;else{let e=Math.max(o.near,L.distanceToPoint(i.origin));s=z(o,e,f.resolution)}L.expandByScalar(s),!1!==i.intersectsBox(L)&&(a?function(e,t){let n=e.matrixWorld,s=e.geometry,a=s.attributes.instanceStart,o=s.attributes.instanceEnd,l=Math.min(s.instanceCount,a.count);for(let s=0;s<l;s++){M.start.fromBufferAttribute(a,s),M.end.fromBufferAttribute(o,s),M.applyMatrix4(n);let l=new u.Vector3,d=new u.Vector3;i.distanceSqToSegment(M.start,M.end,d,l),d.distanceTo(l)<.5*r&&t.push({point:d,pointOnLine:l,distance:i.origin.distanceTo(d),object:e,face:null,faceIndex:s,uv:null,[x]:null})}}(this,t):function(e,t,n){let s=t.projectionMatrix,a=e.material.resolution,o=e.matrixWorld,l=e.geometry,d=l.attributes.instanceStart,c=l.attributes.instanceEnd,f=Math.min(l.instanceCount,d.count),p=-t.near;i.at(1,E),E.w=1,E.applyMatrix4(t.matrixWorldInverse),E.applyMatrix4(s),E.multiplyScalar(1/E.w),E.x*=a.x/2,E.y*=a.y/2,E.z=0,_.copy(E),A.multiplyMatrices(t.matrixWorldInverse,o);for(let t=0;t<f;t++){if(w.fromBufferAttribute(d,t),S.fromBufferAttribute(c,t),w.w=1,S.w=1,w.applyMatrix4(A),S.applyMatrix4(A),w.z>p&&S.z>p)continue;if(w.z>p){let e=w.z-S.z,t=(w.z-p)/e;w.lerp(S,t)}else if(S.z>p){let e=S.z-w.z,t=(S.z-p)/e;S.lerp(w,t)}w.applyMatrix4(s),S.applyMatrix4(s),w.multiplyScalar(1/w.w),S.multiplyScalar(1/S.w),w.x*=a.x/2,w.y*=a.y/2,S.x*=a.x/2,S.y*=a.y/2,M.start.copy(w),M.start.z=0,M.end.copy(S),M.end.z=0;let l=M.closestPointToPointParameter(_,!0);M.at(l,j);let f=u.MathUtils.lerp(w.z,S.z,l),h=f>=-1&&f<=1,m=_.distanceTo(j)<.5*r;if(h&&m){M.start.fromBufferAttribute(d,t),M.end.fromBufferAttribute(c,t),M.start.applyMatrix4(o),M.end.applyMatrix4(o);let r=new u.Vector3,s=new u.Vector3;i.distanceSqToSegment(M.start,M.end,s,r),n.push({point:s,pointOnLine:r,distance:i.origin.distanceTo(s),object:e,face:null,faceIndex:t,uv:null,[x]:null})}}}(this,o,t))}}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(g),this.material.uniforms.resolution.value.set(g.z,g.w))}}class O extends h{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){let t=e.length-3,n=new Float32Array(2*t);for(let i=0;i<t;i+=3)n[2*i]=e[i],n[2*i+1]=e[i+1],n[2*i+2]=e[i+2],n[2*i+3]=e[i+3],n[2*i+4]=e[i+4],n[2*i+5]=e[i+5];return super.setPositions(n),this}setColors(e,t=3){let n=e.length-t,i=new Float32Array(2*n);if(3===t)for(let r=0;r<n;r+=t)i[2*r]=e[r],i[2*r+1]=e[r+1],i[2*r+2]=e[r+2],i[2*r+3]=e[r+3],i[2*r+4]=e[r+4],i[2*r+5]=e[r+5];else for(let r=0;r<n;r+=t)i[2*r]=e[r],i[2*r+1]=e[r+1],i[2*r+2]=e[r+2],i[2*r+3]=e[r+3],i[2*r+4]=e[r+4],i[2*r+5]=e[r+5],i[2*r+6]=e[r+6],i[2*r+7]=e[r+7];return super.setColors(i,t),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class D extends B{constructor(e=new O,t=new v({color:16777215*Math.random()})){super(e,t),this.isLine2=!0,this.type="Line2"}}let N=a.forwardRef(function({points:e,color:t=16777215,vertexColors:n,linewidth:i,lineWidth:r,segments:s,dashed:l,...d},f){var p,m;let x=(0,o.D)(e=>e.size),g=a.useMemo(()=>s?new B:new D,[s]),[y]=a.useState(()=>new v),b=(null==n||null==(p=n[0])?void 0:p.length)===4?4:3,w=a.useMemo(()=>{let i=s?new h:new O,r=e.map(e=>{let t=Array.isArray(e);return e instanceof u.Vector3||e instanceof u.Vector4?[e.x,e.y,e.z]:e instanceof u.Vector2?[e.x,e.y,0]:t&&3===e.length?[e[0],e[1],e[2]]:t&&2===e.length?[e[0],e[1],0]:e});if(i.setPositions(r.flat()),n){t=16777215;let e=n.map(e=>e instanceof u.Color?e.toArray():e);i.setColors(e.flat(),b)}return i},[e,s,n,b]);return a.useLayoutEffect(()=>{g.computeLineDistances()},[e,g]),a.useLayoutEffect(()=>{l?y.defines.USE_DASH="":delete y.defines.USE_DASH,y.needsUpdate=!0},[l,y]),a.useEffect(()=>()=>{w.dispose(),y.dispose()},[w]),a.createElement("primitive",(0,c.Z)({object:g,ref:f},d),a.createElement("primitive",{object:w,attach:"geometry"}),a.createElement("primitive",(0,c.Z)({object:y,attach:"material",color:t,vertexColors:!!n,resolution:[x.width,x.height],linewidth:null!==(m=null!=i?i:r)&&void 0!==m?m:1,dashed:l,transparent:4===b},d)))});var I=n(1500),P=n(5822),T=n(2642),R=n(7179);let V=(0,n(3009).p1)(R.YY);function H(e){let{integrity:t,blight:n}=e,i=(0,a.useRef)(null),r=(0,a.useRef)([]),l=(0,a.useMemo)(()=>t>80?"#a855f7":t>50?"#22c55e":t>25?"#eab308":"#ef4444",[t]);return(0,o.F)(e=>{i.current&&(i.current.rotation.y+=.002),r.current.forEach((t,n)=>{t&&(t.position.y=.1*Math.sin(e.clock.elapsedTime+n)+.5*n)})}),(0,s.jsxs)("group",{ref:i,children:[(0,s.jsxs)("mesh",{position:[0,2,0],children:[(0,s.jsx)("cylinderGeometry",{args:[.1,.5,4,8]}),(0,s.jsx)("meshStandardMaterial",{color:l,emissive:l,emissiveIntensity:t/100,metalness:.8,roughness:.2})]}),[0,1,2,3].map(e=>(0,s.jsx)(d.b,{speed:2,floatIntensity:.5,children:(0,s.jsxs)("mesh",{ref:t=>{t&&(r.current[e]=t)},position:[1*Math.cos(e/4*Math.PI*2),.5*e+1,1*Math.sin(e/4*Math.PI*2)],children:[(0,s.jsx)("octahedronGeometry",{args:[.15]}),(0,s.jsx)("meshStandardMaterial",{color:l,emissive:l,emissiveIntensity:.5,transparent:!0,opacity:.8})]})},e)),Array.from({length:n}).map((e,t)=>(0,s.jsx)(G,{index:t},t))]})}function G(e){let{index:t}=e,n=(0,a.useRef)(null),i=t/5*Math.PI*2;return(0,o.F)(e=>{n.current&&(n.current.scale.setScalar(.3+.1*Math.sin(3*e.clock.elapsedTime+t)),n.current.material.opacity=.5+.2*Math.sin(2*e.clock.elapsedTime))}),(0,s.jsxs)("mesh",{ref:n,position:[1.5*Math.cos(i),1+.3*t,1.5*Math.sin(i)],children:[(0,s.jsx)("dodecahedronGeometry",{args:[.2]}),(0,s.jsx)("meshStandardMaterial",{color:"#1f1f1f",emissive:"#4a0000",emissiveIntensity:.5,transparent:!0,opacity:.7,wireframe:!0})]})}function F(e){let{student:t,index:n,total:i,isCurrentUser:r}=e,l=(0,a.useRef)(null),d=n/i*Math.PI*2,c=4+t.overflow_generated/50,f=(0,a.useMemo)(()=>"radiant"===t.current_state?"#a855f7":"stable"===t.current_state?"#22c55e":"#6b7280",[t.current_state]);(0,o.F)(e=>{if(l.current){let n="radiant"===t.current_state?.1*Math.sin(3*e.clock.elapsedTime)+1:1;l.current.scale.setScalar(.2+t.battery_level/200*n)}});let p=[Math.cos(d)*c,.5*Math.sin(.5*n),Math.sin(d)*c];return(0,s.jsxs)("group",{children:[(0,s.jsxs)("mesh",{ref:l,position:p,children:[(0,s.jsx)("sphereGeometry",{args:[.3,16,16]}),(0,s.jsx)("meshStandardMaterial",{color:f,emissive:f,emissiveIntensity:t.battery_level/100})]}),"radiant"===t.current_state&&(0,s.jsx)(N,{points:[p,[0,1,0]],color:f,lineWidth:1,transparent:!0,opacity:.3}),r&&(0,s.jsxs)("mesh",{position:p,children:[(0,s.jsx)("ringGeometry",{args:[.4,.5,32]}),(0,s.jsx)("meshBasicMaterial",{color:"#ffffff",transparent:!0,opacity:.5,side:u.DoubleSide})]})]})}function W(e){let{weather:t}=e;return"aurora"===t?(0,s.jsx)(I.t,{radius:100,depth:50,count:2e3,factor:6,saturation:1}):"storm"===t?(0,s.jsx)("group",{children:(0,s.jsx)("ambientLight",{intensity:.1})}):"fog"===t?(0,s.jsx)("fog",{attach:"fog",args:["#1a1a2e",5,20]}):(0,s.jsx)(I.t,{radius:100,depth:50,count:1e3,factor:4})}function k(e){let{students:t,classIntegrity:n,blightNodes:i,weatherState:r,currentUserId:a,onRepair:o,canRepair:d}=e;return(0,s.jsxs)("div",{className:"relative w-full h-full min-h-[500px]",children:[(0,s.jsxs)(l.Xz,{camera:{position:[0,5,10],fov:60},children:[(0,s.jsx)("ambientLight",{intensity:"storm"===r?.1:.3}),(0,s.jsx)("pointLight",{position:[0,5,0],intensity:1,color:"#a855f7"}),(0,s.jsx)(W,{weather:r}),(0,s.jsx)(H,{integrity:n,blight:i}),t.map((e,n)=>(0,s.jsx)(F,{student:e,index:n,total:t.length,isCurrentUser:e.id===a},e.id)),(0,s.jsx)("gridHelper",{args:[20,20,"#2a2a4a","#1a1a2e"],position:[0,-1,0]}),(0,s.jsxs)(P.x,{children:[(0,s.jsx)(T.d,{luminanceThreshold:.3,luminanceSmoothing:.9,intensity:1}),"storm"===r&&(0,s.jsx)(V,{offset:[.002,.002]})]})]}),(0,s.jsxs)("div",{className:"absolute top-4 left-4 right-4 flex justify-between items-start",children:[(0,s.jsxs)("div",{children:[(0,s.jsx)("h2",{className:"text-2xl font-bold text-white",children:"The Nexus"}),(0,s.jsxs)("p",{className:"text-sm ".concat("aurora"===r?"text-purple-400":"clear"===r?"text-green-400":"fog"===r?"text-yellow-400":"text-red-400"),children:["aurora"===r&&"✨ Aurora - Maximum Unity","clear"===r&&"☀️ Clear - Strong Connection","fog"===r&&"\uD83C\uDF2B️ Fog - Weakening Signal","storm"===r&&"⛈️ Storm - System Unstable"]})]}),(0,s.jsxs)("div",{className:"bg-surface-900/80 rounded-xl p-3 backdrop-blur-sm",children:[(0,s.jsx)("div",{className:"text-xs text-surface-400 mb-1",children:"CLASS INTEGRITY"}),(0,s.jsxs)("div",{className:"flex items-center gap-2",children:[(0,s.jsx)("div",{className:"w-24 h-3 bg-surface-700 rounded-full overflow-hidden",children:(0,s.jsx)("div",{className:"h-full transition-all duration-500 ".concat(n>80?"bg-purple-500":n>50?"bg-green-500":n>25?"bg-yellow-500":"bg-red-500"),style:{width:"".concat(n,"%")}})}),(0,s.jsxs)("span",{className:"text-lg font-bold text-white",children:[n,"%"]})]}),i>0&&(0,s.jsxs)("div",{className:"text-xs text-red-400 mt-1",children:["⚠️ ",i," Blight Node",i>1?"s":""," Active"]})]})]}),(0,s.jsxs)("div",{className:"absolute bottom-24 left-4 bg-surface-900/80 rounded-xl p-3 backdrop-blur-sm",children:[(0,s.jsx)("div",{className:"text-xs text-surface-400",children:"CONNECTED"}),(0,s.jsxs)("div",{className:"text-2xl font-bold text-white",children:[t.filter(e=>"dim"!==e.current_state).length,"/",t.length]})]}),d&&i>0&&(0,s.jsx)("div",{className:"absolute bottom-6 left-0 right-0 flex justify-center",children:(0,s.jsx)("button",{onClick:o,className:"px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-lg text-white shadow-lg shadow-purple-500/25",children:"\uD83D\uDD27 Repair Nexus (Uses Overflow)"})})]})}},2677:function(e,t,n){n.d(t,{Z:function(){return i}});function i(){return(i=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var i in n)({}).hasOwnProperty.call(n,i)&&(e[i]=n[i])}return e}).apply(null,arguments)}},5822:function(e,t,n){let i;n.d(t,{x:function(){return u}});var r=n(8357),s=n(1869),a=n(921),o=n(440),l=n(7179);let d=(0,a.createContext)(null),c=e=>(e.getAttributes()&l.VB.CONVOLUTION)===l.VB.CONVOLUTION,u=a.memo((0,a.forwardRef)(({children:e,camera:t,scene:n,resolutionScale:u,enabled:f=!0,renderPriority:p=1,autoClear:h=!0,depthBuffer:m,enableNormalPass:v,stencilBuffer:x,multisampling:g=8,frameBufferType:y=s.HalfFloatType},b)=>{let{gl:w,scene:S,camera:E,size:_}=(0,o.D)(),A=n||S,M=t||E,[j,L,U]=(0,a.useMemo)(()=>{let e=function(){var e;if(void 0!==i)return i;try{let t;let n=document.createElement("canvas");return i=!!(window.WebGL2RenderingContext&&(t=n.getContext("webgl2"))),t&&(null==(e=t.getExtension("WEBGL_lose_context"))||e.loseContext()),i}catch(e){return i=!1}}(),t=new l.xC(w,{depthBuffer:m,stencilBuffer:x,multisampling:g>0&&e?g:0,frameBufferType:y});t.addPass(new l.CD(A,M));let n=null,r=null;return v&&((r=new l.gh(A,M)).enabled=!1,t.addPass(r),void 0!==u&&e&&((n=new l.xs({normalBuffer:r.texture,resolutionScale:u})).enabled=!1,t.addPass(n))),[t,r,n]},[M,w,m,x,g,y,A,v,u]);(0,a.useEffect)(()=>null==j?void 0:j.setSize(_.width,_.height),[j,_]),(0,o.F)((e,t)=>{if(f){let e=w.autoClear;w.autoClear=h,x&&!h&&w.clearStencil(),j.render(t),w.autoClear=e}},f?p:0);let C=(0,a.useRef)(null),z=(0,o.A)(C);(0,a.useLayoutEffect)(()=>{let e=[];if(C.current&&z.current&&j){let t=z.current.objects;for(let n=0;n<t.length;n++){let i=t[n];if(i instanceof l.Qm){let r=[i];if(!c(i)){let e=null;for(;(e=t[n+1])instanceof l.Qm&&!c(e);)r.push(e),n++}let s=new l.H5(M,...r);e.push(s)}else i instanceof l.w2&&e.push(i)}for(let t of e)null==j||j.addPass(t);L&&(L.enabled=!0),U&&(U.enabled=!0)}return()=>{for(let t of e)null==j||j.removePass(t);L&&(L.enabled=!1),U&&(U.enabled=!1)}},[j,e,M,L,U,z]),(0,a.useEffect)(()=>{let e=w.toneMapping;return w.toneMapping=s.NoToneMapping,()=>{w.toneMapping=e}},[]);let B=(0,a.useMemo)(()=>({composer:j,normalPass:L,downSamplingPass:U,resolutionScale:u,camera:M,scene:A}),[j,L,U,u,M,A]);return(0,a.useImperativeHandle)(b,()=>j,[j]),(0,r.jsx)(d.Provider,{value:B,children:(0,r.jsx)("group",{ref:C,children:e})})}))},2642:function(e,t,n){n.d(t,{d:function(){return r}});var i=n(7179);let r=(0,n(3009).p1)(i.rk,{blendFunction:i.YQ.ADD})},3009:function(e,t,n){n.d(t,{p1:function(){return l}});var i=n(8357),r=n(921),s=n(440);let a=0,o=new WeakMap,l=(e,t)=>r.forwardRef(function({blendFunction:n=null==t?void 0:t.blendFunction,opacity:l=null==t?void 0:t.opacity,...d},c){let u=o.get(e);if(!u){let t=`@react-three/postprocessing/${e.name}-${a++}`;(0,s.e)({[t]:e}),o.set(e,u=t)}let f=(0,s.D)(e=>e.camera),p=r.useMemo(()=>{var e,n;return[...null!=(e=null==t?void 0:t.args)?e:[],...null!=(n=d.args)?n:[{...t,...d}]]},[JSON.stringify(d)]);return(0,i.jsx)(u,{camera:f,"blendMode-blendFunction":n,"blendMode-opacity-value":l,...d,ref:c,args:p})})},3400:function(e,t,n){n.d(t,{i:function(){return i}});let i=parseInt(n(1869).REVISION.replace(/\D+/g,""))}}]);