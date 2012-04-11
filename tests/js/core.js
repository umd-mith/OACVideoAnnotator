(function() {

  $(document).ready(function() {
    test("Check requirements", function() {
      expect(3);
      ok(typeof MITHGrid !== "undefined" && MITHGrid !== null, "MITHGrid");
      ok(typeof jQuery !== "undefined" && jQuery !== null, "jQuery");
      return ok(typeof Raphael !== "undefined" && Raphael !== null, "Raphael");
    });
    return test("Check OAC Namespace", function() {
      expect(1);
      return ok(typeof OAC !== "undefined" && OAC !== null, "OAC namespace defined");
    });
  });

}).call(this);
