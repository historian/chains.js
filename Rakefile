task :build do
  sh "mkdir -p build"

  Dir.glob('./src/*.js').each do |mod_file|
    mod = File.read(mod_file)
    mod = mod.gsub(/(\A\s+)|(\s+\Z)/m, '')
    mod_name = File.basename(mod_file, '.js')
    puts "building: #{mod_name}"

    Dir.glob('./wrappers/*.js').each do |variant|
      wrapper = File.read(variant)
      name = File.basename(variant).sub('mod', mod_name)

      real_mod = mod.dup
      real_mod = real_mod.gsub(%r{^//\s*(<!\-\-\[([^\]]+)\]\-\->)(.+)^//\s*\1}m) do
        ($2 == File.basename(variant, '.mod.js') ? $3 : '')
      end
      real_mod = real_mod.gsub(/(\A\s+)|(\s+\Z)/m, '')

      target = wrapper.sub(/^([ \t]+)[%]{3}\s+import\s+[%]{3}/m) do
        $1 + real_mod.gsub("\n", "\n#{$1}")
      end
      target = target.gsub(/^[ \t]+$/, '')

      File.open(File.join('build', name), 'w+') do |f|
        f.write target
      end
      
      # --externs
      sh "closure --compilation_level SIMPLE_OPTIMIZATIONS --js_output_file #{File.join('build', name.sub(/\.js$/, '.min.js'))} --js #{File.join('build', name)} "
    end
  end
end

desc "Build the docco documentation"
task :doc do
  sh "docco src/*.js"
end