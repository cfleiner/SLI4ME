const slime = document.getElementById("slime-logo");
const displacement = document.getElementById("displacement");

let t = 0;

function animate() {
if (slime.matches(":hover")) {
    t += 0.05;

    const scale = 15 + Math.sin(t) * 50;
    displacement.setAttribute("scale", scale);

    slime.style.filter = "url(#wobble)";
} else {
    displacement.setAttribute("scale", 0);
    slime.style.filter = "none";
}

requestAnimationFrame(animate);
}

animate();
